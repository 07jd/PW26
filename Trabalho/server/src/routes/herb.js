import { Router } from "express"
import multer from "multer"
import fs from "fs"
import csv from "csv-parser"
import authMiddleware from "../middleware/authMiddlewares.js"
import herbModel from "../models/herb.js"
import { errorToJson } from "../util/db.js"
import mongoose from "mongoose"

const route_name = "/herb";
const router = Router();
export { route_name, router };

const upload = multer({ dest: "uploads/" });

// Create herb
router.post("/", authMiddleware, async (req,res) => {
    try
    {
        const data = req.body;
        if(!data) return res.status(400).send();

        data.createdBy = req.user.id;
        data.updatedBy = req.user.id;
        console.log(data);
        await herbModel.create(data);

        res.status(200).send();
    }
    catch(e) { errorToJson(e, res); }
})

// Create a batch of herbs from a csv file
router.post("/upload", authMiddleware, upload.single("file"), async (req,res) => {
    // TODO: Parse
    if(!req.file || !req.file.path) return res.status(400).send();
    
    const path = req.file.path;
    const user_id = req.user.id;
    console.log(req.file);
    try
    {
        // TODO: Parsing
        fs.unlinkSync(path);
        res.status(400).send();
    }
    catch(e)
    {
        console.log(e);
        return res.status(500).send();
    }
})

// Change herb parameters via id
router.patch("/:id", authMiddleware, async (req,res) => {
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
        res.status(200).send();
    }
    catch(e)
    {
        errorToJson(e, res);
    }
})

/*
* search?name=XXXXXX -> devolve full detalhes sobre erva de nome X
* search?page=XXXXXX -> devolve pagina x com full info de ervas (ordem decrescente de criaçao)
* search?id=xxxxxxx
*        OBS= -1 = tudo
* search             -> devolve {nome, id} de todos as ervas
*/
router.get("/search", authMiddleware, async (req, res) => {
    try
    {
        const herb_name = req.query.name;
        if(herb_name)
        {
            const herb = await herbModel.findOne({ name: { $regex: herb_name, $options: "i" } });
            if(!herb) return res.status(404).send();

            const clean = {
                id: herb._id,
                ...herb
            };
            delete clean._id;

            return res.status(200).json(clean);
        }

        const herb_id = req.query.id;
        if(herb_id)
        {
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

        const page = req.query.page;
        if(page)
        {
            if(page <= 0)
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

            const herbs = (await herbModel.find({}).sort({ createdAt: -1 }).skip(page*25).limit(25).lean())
            .map(({_id, ...rest}) => ({
                id: _id,
                ...rest
            }));

            const page_count = Math.floor((await herbModel.countDocuments())/25);
            return res.status(200).json({
                pages: page_count,
                data: herbs
            });
        }

        const herbs = (await herbModel.find({}, "_id name").lean()).map(({_id, ...rest}) => ({
            id: _id,
            ...rest
        }));

        return res.status(200).json(herbs);
    } 
    catch(e)
    {
        console.log(e);    
        return res.status(500).send();
    }
})