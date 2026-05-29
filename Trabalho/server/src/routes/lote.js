import { Router } from "express"
import authMiddleware from "../middleware/authMiddlewares.js"
import loteModel from "../models/lote.js";
import herbModel from "../models/herb.js"
import { supervisorPage } from "../middleware/roleMiddlewares.js";
import { errorToJson } from "../util/db.js";
import mongoose from "mongoose";
import planModel from "../models/plan.js";

const route_name = "/lote";
const router = Router();
export { route_name, router };

/*
* search?lote=XXXXXX -> devolve detalhes sobre lote de num X
* search?page=XXXXXX -> devolve pagina x com full info de lotes (ordem crescente do num)
* search             -> devolve {num, id} de todos os lotes
*/
router.get("/search", authMiddleware, async (req,res) => {
    try
    {
        const num_lote = req.query.lote;
        if(num_lote)
        {
            const lote = await loteModel.findOne({ num: num_lote });
            if(!lote) return res.status(404).send();

            const clean = {
                id: lote._id,
                ...lote
            };
            delete clean._id;

            return res.status(200).json(clean);
        }

        const page = req.query.page;
        if(page)
        {
            if(page < 0)
            {
                const lotes = (await loteModel.find().sort({ num: 1 })
                    .populate("herb", "_id name category")
                    .populate("plans", "_id name type")
                    .populate("createdBy", "_id username email")
                    .lean());

                const result = [];
                for(const lote of lotes)
                {
                    const el = lote;
                    el.id = el._id;
                    el.createdBy.id = el.createdBy._id;
                    delete el._id;
                    delete el.createdBy._id;

                    if(el.herb)
                    {
                        el.herb.id = el.herb._id;
                        delete el.herb._id;
                    }

                    for(const plan of el.plans)
                    {
                        plan.id = plan._id;
                        delete plan._id;
                    }

                    result.push(el);
                }

                return res.status(200).json(result);
            }


            const lotes = (await loteModel.find().sort({ num: 1 }).skip(page * 25).limit(25).lean())
                .map(({_id, ...rest}) => ({
                    id: _id,
                    ...rest
                }));

            return res.status(200).json(lotes);
        }

        const lotes = (await loteModel.find({}, "_id num").sort({ num: 1 }).lean()) .map(({_id, ...rest}) => ({
            id: _id,
            ...rest
        }));

        return res.status(200).json(lotes);
    }
    catch
    {
        console.log(e);
        return res.status(500).send();
    }
})

// Associar plano
router.post("/plano/:lote/:id", authMiddleware, supervisorPage, async (req, res) => {
    try
    {
        const lote_num = Number(req.params.lote);
        const plano_id = req.params.id;


        console.log(lote_num);
        console.log(plano_id);

        if (Number.isNaN(lote_num)) return res.status(400).send();
        if (!mongoose.Types.ObjectId.isValid(plano_id)) return res.status(400).send();

        const lote = await loteModel.findOne({ num: lote_num });
        if(!lote) return res.status(404).send();

        const plano = await planModel.findById(plano_id);
        if(!plano) return res.status(404).send();


        await loteModel.updateOne(
            { num:  lote_num },
            { $addToSet: { plans: plano._id }}
        )

        return res.status(200).send();
    }
    catch(e)
    {
        console.log(e);
        return res.status(500).send();
    }
})

// Criar lote
router.post("/", authMiddleware, supervisorPage, async (req, res) => {
    try
    {
        const data = req.body;
        if(!data) return res.status(400).send();
        data.createdBy = req.user.id;


        if(data.herb)
        {
            const msg = {
                type: "validation",
                errors: {
                    herb: "ID inválido"
                }
            };

            if (!mongoose.Types.ObjectId.isValid(data.herb)) return res.status(400).json(msg);
            const herb = await herbModel.findById(data.herb);
            if(!herb) return res.status(400).json(msg);
        }

        if(data.start && data.start > Date.now())
        {
            const msg = {
                type: "validation",
                errors: {
                    start: "Data inválida"
                }
            };

            return res.status(400).json(msg);
        }
        const lote = await loteModel.create(data);
        return res.status(200).json(lote);
    }
    catch(e)
    {
        console.log(e);
        errorToJson(e, res);
    }
})

// Update harvest measures 
// params modificaveis:
//  quantityHarvested
//  quantityLoss
router.patch("/harvest/:num", authMiddleware, async (req, res) => {
    try
    {
        const num_lote = req.params.num;
        console.log(num_lote);
        const lote = await loteModel.findOne({ num: num_lote });
        if(!lote) return res.status(404).send();

        const raw = req.body;
        const data = {
            quantityHarvested: raw.quantityHarvested,
            quantityLoss: raw.quantityLoss,
            updatedBy: req.user.id
        };

        Object.assign(lote, data);
        await lote.save();

        return res.status(200).send();
    }
    catch(e)
    {
        console.log(e);
        errorToJson(e, res);
    }
})

// Full update harvest measures
// deve ser responsável/admin
router.patch("/:num", authMiddleware, supervisorPage, async (req, res) => {
    try
    {
        const data = req.body;
        const num_lote = Number(req.params.num);
        if(!data) return res.status(400).send();
        if(Number.isNaN(num_lote)) return res.status(400).send();

        // Clean
        delete data._id;
        delete data.createdBy;
        delete data.updatedBy;
        data.updatedBy = req.user.id;

        const lote = await loteModel.findOne({ num: num });
        if(!lote) return res.status(404).send();

        if(data.herb)
        {
            if (typeof(data.herb) !== "string") return res.status(400).json({
                type: "validation",
                errors: {
                    "herb": "ID inválido"
                }
            });

            const herb = await herbModel.findOne({ _id: data.herb });
            if(!herb) return res.status(400).json({
                type: "validation",
                errors: {
                    "herb": "Erva não existe"
                }
            })
        }
        Object.assign(lote, data);
        await lote.save();

        return res.status(200).send();
    }
    catch(e)
    {
        console.log(e);
        errorToJson(e, res);
    }
})

// Delete lote
router.delete("/:num", authMiddleware, supervisorPage, async (req, res) => {
    try
    {
        const lote_num = Number(req.params.num);
        if(Number.isNaN(lote_num)) return res.status(400).send();

        const deleted = await loteModel.findOneAndDelete({ num: lote_num });
        if(!deleted) return res.status(404).send();

        await metricModel.deleteMany({ lote: lote_num });

        return res.status(200).send();
    }
    catch(e)
    {
        console.log(e);
        return res.status(500).send();
    }
})