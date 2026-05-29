import { Router } from "express"
import planModel, { emergencyPlan, pontualPlan, regularPlan } from "../models/plan.js"
import herbModel from "../models/herb.js"
import loteModel from "../models/lote.js"
import { errorToJson } from "../util/db.js"
import { supervisorPage } from "../middleware/roleMiddlewares.js"
import authMiddleware from "../middleware/authMiddlewares.js";
import mongoose from "mongoose"

const route_name = "/plan";
const router = Router();
export { route_name, router };

/*
* search?name=XXXXXX -> devolve detalhes sobre plano de nome X
* search?page=XXXXXX -> devolve pagina x com full info de planos (ordem decrescente de criação)
* search?id=XXXXXX   
* search?page=-1     -> devolve tudo
* search             -> devolve {nome, id} de todos os planos
*/
router.get("/search", authMiddleware, async (req,res) => {
    try
    {
        const plan_id = req.query.id;
        if(plan_id)
        {
            if(!mongoose.isValidObjectId(plan_id)) return res.status(400).send();
            const plan = await planModel
              .findById(plan_id)
              .populate("herb", "_id name category")
              .lean();
            
              if (!plan) return res.status(404).send();


            const result = {
              id: plan._id,
              ...plan,
              herb: plan.herb
                ? {
                    id: plan.herb._id,
                    name: plan.herb.name,
                    category: plan.herb.category,
                  }
                : null,
            };
            delete result._id;

            return res.status(200).json(result);
        }

        const name = req.query.name;
        if(name)
        {
            const plan = await planModel.findOne({ name: name });
            if (!plan) return res.status(404).send();
            
            const clean = {
                id: plan._id,
                ...plan
            };
            delete clean._id;

            return res.status(200).json(clean);
        }

        const page = req.query.page;
        if(page)
        {
            if (page < 0)
            {
                const plans = (await planModel.find().sort({ createdAt: -1 })
                    .populate("herb", "name description category")
                    .lean())
                    .map(({_id, ...rest}) => ({
                        id: _id,
                        ...rest
                    }));

                return res.status(200).json(plans);
            }

            const plans = (await planModel.find().sort({ createdAt: -1 }).skip(page * 25).limit(25).lean())
                .map(({_id, ...rest}) => ({
                    id: _id,
                    ...rest
                }));

            const page_count = Math.floor((await planModel.countDocuments())/25);
            return res.status(200).json({
                pages: page_count,
                data: plans
            });
        }

        const plans = (await planModel.find({}, "_id name").lean()).map(({_id, ...rest}) => ({
            id: _id,
            ...rest
        }));

        return res.status(200).json(plans);
    }
    catch(e)
    {
        console.log(e);
        return res.status(500).send();
    }
})

// Create plan
router.post("/:type", authMiddleware, supervisorPage, async (req,res) => {
    try
    {
        const plan_type = req.params.type;
        if (!(plan_type === "regular" || plan_type === "emergencia" || plan_type === "pontual" ))
            return res.status(400).send();
        
        const data = req.body;
        if(!data) return res.status(400).send();

        if (plan_type === "regular")
            await regularPlan.create(data);
        else if (plan_type === "emergencia")
            await emergencyPlan.create(data);
        else
            await pontualPlan.create(data);

        return res.status(200).send();
    }
    catch(e)
    {
        console.log(e);
        errorToJson(e, res);
    }
})

// Update plan
router.patch("/:id", authMiddleware, supervisorPage, async (req,res) => {
    try
    {
        const data = req.body;
        if(!data) return res.status(400).send();

        // Clean
        delete data._id;
        delete data.id;
        delete data.type;

        const plan_id = req.params.id;
        const plan = await planModel.findOne({ _id: plan_id });
        if(!plan) return res.status(404).send();
        
        // Check if new herb is valid,
        // if so, only allow changes when the plan isnt in use
        if(data.herb)
        {
            const herb = await herbModel.findOne({ _id: data.herb });
            if(!herb)
            {
                return res.status(400).json({
                    type: "validation",
                    errors: {
                        herb: "Erva inválida"
                    }
                });
            }

            const lote_em_uso = await loteModel.findOne({ plans: plan._id });
            if(lote_em_uso)
            {
                return res.status(400).json({
                    type: "validation",
                    errors: {
                        herb: "Não é possivel mudar, existe um lote desta erva a usar este plano"
                    }
                });
            }
        }

        Object.assign(plan, data);
        await plan.save();

        return res.status(200).send();
    }
    catch(e)
    {
        console.log(e);
        errorToJson(e, res);
    }
})

// Delete plan
router.delete("/:id", authMiddleware, supervisorPage, async (req,res) => {
    try
    {
        const id = req.params.id;
        const plan = await planModel.findOne({ _id: id });
        if (!plan) return res.status(404).send();

        const dependent_lotes = await loteModel.findOne({ plans: plan._id });
        if(dependent_lotes)
        {
            return res.status(400).json({
                type: "validation",
                errors: {
                    message: "Há lotes que dependem neste plano"
                }
            });
        }

        const deleted = await planModel.findByIdAndDelete(plan._id);
        if(!deleted) return res.status(500).send();

        return res.status(200).send();
    }
    catch(e)
    {
        console.log(e);
        return res.status(500).send();
    }
})