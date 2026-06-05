import { Router } from "express"
import multer from "multer"
import { parse } from "csv-parse/sync"
import authMiddleware from "../middleware/authMiddlewares.js"
import { supervisorPage } from "../middleware/roleMiddlewares.js"
import herbModel from "../models/herb.js"
import planModel from "../models/plan.js"
import { errorToJson } from "../util/db.js"
import mongoose from "mongoose"
import logModel from "../models/log.js"

const route_name = "/herb";
const router = Router();
export { route_name, router };

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10*(1024*1024), // 10mb
        files: 1,
    },
    fileFilter: (_req, f, cb) => {
        if(!f.mimetype.includes("csv") || !f.originalname.toLowerCase().endsWith(".csv")) 
            return cb(new Error("Non csv file"));

        cb(null, true);
    }
});

// Create herb
router.post("/", authMiddleware, supervisorPage, async (req,res) => {
    try
    {
        const data = req.body;
        if(!data) return res.status(400).send();

        data.createdBy = req.user.id;
        data.updatedBy = req.user.id;
        console.log(data);
        await herbModel.create(data);

        // Log action
        await logModel.create({
            user: req.user.id,
            description: `[Herb] Erva criada (modo manual)`
        })

        res.status(200).send();
    }
    catch(e) { errorToJson(e, res); }
})

// Create a batch of herbs from a csv file
router.post("/upload", authMiddleware, supervisorPage, upload.single("file"), async (req,res) => {
    const file = req.file;
    if(!file) return res.status(400).json({
        type: "validation",
        errors: {
            file: "Nenhum ficheiro csv válido"
        }
    });


    let parsed = [];
    try
    {
        const content = req.file.buffer.toString();
        parsed = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });
    }
    catch(e)
    {
        return res.status(400).json({
            type: "validation",
            errors: {
                file: "Ficheiro csv inválido"
            }
        })
    }

    if(parsed.length === 0) return res.status(400).json({
        type: "validation",
        errors: {
            file: "Ficheiro vazio"
        }
    });
    
    // Validate
    let valid_csv = true;
    const user_id = req.user.id;
    let line_error = 1;

    const new_names = parsed.map(v => v.name);
    const dupped = await herbModel.find({ name: { $in: new_names } });

    if(dupped.length !== 0) return res.status(400).json({
        type: "validation",
        errors: {
            file: `Existem nomes duplicados: [${dupped.map(e => e.name)}]` 
        }
    })

    try
    {
        for(const v of parsed)
        {
            v.createdBy = user_id;
            const new_herb = new herbModel(v);
            await new_herb.validate();
            line_error += 1;
        }
    } catch(e) {
        valid_csv = false 
    }

    if(!valid_csv) return res.status(400).json({
        type: "validation",
        errors: {
            file: `A linha ${line_error} contem data inválida`
        }
    });

    // Create
    try
    {
        for(const v of parsed)
        {
            v.createdBy = user_id;
            await herbModel.create(v);
        }
    }
    catch
    {
        return res.status(500).send();
    }


    // Log action
    await logModel.create({
        user: req.user.id,
        description: `[Herb] Batch de ervas criada (via csv)`
    })

    return res.status(200).send();
})

// Change herb parameters via id
router.patch("/:id", authMiddleware, supervisorPage, async (req,res) => {
    try
    {
        const id = req.params.id;
        const data = req.body;
        if(!data) return res.status(400).send();

        // Append who updated this herb
        delete data.createdBy;
        data.updatedBy = req.user.id;

        const herb = await herbModel.findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocumentAfter: true, runValidators: true}
        );

        if (!herb) return res.status(404).send();

        // Log action
        await logModel.create({
            user: req.user.id,
            description: `[Herb] Erva (${herb.name}) modificada`
        })

        res.status(200).send();
    }
    catch(e)
    {
        errorToJson(e, res);
    }
})

// Get by id
router.get("/:id", authMiddleware, supervisorPage, async (req, res) => {
    try
    {
        const herb_id = req.params.id;
        if(!mongoose.isValidObjectId(herb_id)) return res.status(400).send();

        const herb = await herbModel.findById(herb_id).lean();
        if(!herb) return res.status(404).send();

        const clean = {
            id: herb._id,
            ...herb
        };
        delete clean._id;

        return res.status(200).json(clean);
    }
    catch
    {
        return res.status(500).send();
    }
});

// Get array of all herbs
router.get("/", authMiddleware, async (_req,res) => {
    try
    {
        const herbs = (await herbModel.find({}).sort({ createdAt: -1 })
            .populate("createdBy", "_id username email")
            .populate("updatedBy", "_id username email")
            .lean()
        )
        .map(({_id, createdBy, updatedBy, ...rest}) => ({
            id: _id,
            ...rest,
            createdBy: createdBy && {
                id: createdBy._id,
                username: createdBy.username,
                email: createdBy.email,
            },
            updatedBy: updatedBy && {
                id: updatedBy._id,
                username: updatedBy.username,
                email: updatedBy.email,
            }
        }));

        return res.status(200).json(herbs);
    }
    catch
    {
        return res.status(500).send();
    }
});

router.delete("/:id", authMiddleware, supervisorPage, async (req, res) => {
    try
    {
        const id = req.params.id;
        if(!mongoose.isValidObjectId(id)) return res.status(400).send();

        const herb = herbModel.findById(id);
        if(!herb) return res.status(404).send();

        const plans_using_herb = (await planModel.find({ herb: herb._id }));
        if(plans_using_herb.length !== 0)
        {
           return res.status(400).json({
            type: "deletion",
            errors: {
                herb: "Não é possível deletar a erva porque está em uso por um plano"
            }
           });
        }

        const deleted = await herbModel.findByIdAndDelete(id);
        if(!deleted) return res.status(404).send();

        // Log action
        await logModel.create({
            user: req.user.id,
            description: `[Herb] Erva (${deleted.name}) apagada`
        })

        return res.status(200).send();
    }
    catch
    {
        return res.status(500).send();
    }
});