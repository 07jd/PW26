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

// Get lote by num
router.get("/:num", authMiddleware, async (req, res) => {
    try
    {
        const num_lote = req.params.num;
        const lote = await loteModel.findOne({ num: num_lote }).lean();
        if(!lote) return res.status(404).send();
        
        const clean = {
            id: lote._id,
            ...lote
        };

        delete clean._id;
        return res.status(200).json(clean);
    }
    catch
    {
        return res.status(500).send();
    }
})

// Get all lotes
router.get("/", authMiddleware, async (_req, res) => {
    try
    {
        const lotes = (await loteModel.find().sort({ num: 1 })
            .populate("herb", "_id name category")
            .populate("plans", "_id name type")
            .populate("createdBy", "_id username email")
            .populate("updatedBy", "_id username email")
            .lean())
        
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

            if(el.updatedBy)
            {
                el.updatedBy.id = el.updatedBy._id;
                delete el.updatedBy._id;
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
    catch
    {
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

        if(data.plans)
        {
            for(const plan of data.plans)
            {
                const plan_data = await planModel.findById(plan);
                if(!plan_data)
                {
                    return res.status(400).json({
                        type: "validation",
                        errors: {
                            plans: "Há um plano inválido na lista"
                        }
                    })
                }

                if(plan_data.herb.toString() !== data.herb.toString())
                {
                    return res.status(400).json({
                        type: "validation",
                        errors: {
                            plans: `O plano "${plan_data.name}" não é compatível com a erva selecionada`
                        }
                    })
                }
            }
        }

        console.log(data.start);
        if(data.start && data.start > new Date())
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

        const lote = await loteModel.findOne({ num: num_lote });
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

        if(data.end && (lote.start > new Date(data.end) || new Date() < new Date(data.end)))
        {
            return res.status(400).json({
                type: "validation",
                errors: {
                    end: "Tempo de termino inválido"
                }
            });
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