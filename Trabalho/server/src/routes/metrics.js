import { Router } from "express"
import planModel from "../models/plan.js"
import loteModel from "../models/lote.js"
import { errorToJson } from "../util/db.js"
import authMiddleware from "../middleware/authMiddlewares.js";
import metricModel from "../models/metric.js"

const route_name = "/metrics";
const router = Router();
export { route_name, router };

function verifyRegularPlan(plan, metrics)
{
    console.log("TODO");
}

function verifyEmergencyPlan(plan, metrics)
{
    console.log("TODO");
}

function verifyPontualPlan(plan, metrics)
{
    console.log("TODO");
}

// Registrar metrica
router.post("/", authMiddleware, async(req,res) => {
    try
    {
        const data = req.body;
        if (!data) return res.status(400).send();

        const msg = {
            type: "validation",
            errors: {
                lote: "ID de lote inválido"
            }
        };

        
        // Validar id do lote
        if (!data.lote || (typeof(data.lote) !== "string")) return res.status(400).json(msg);
        const lote = await loteModel.findById(data.lote);
        if (!lote || lote.state === "concluido") return res.status(400).json(msg);
    

        const metric_data = await metricModel.create(data);
        for(const planID of lote.plans)
        {
            const plan = await planModel.findById(planID);

            // TODO: completar isto
            // fazer a logica de verificação e tomada de decisoes
            // por consequencia, geração de avisos
            let warning;
            if (plan.type === "regular")
                warning = verifyRegularPlan(plan, metric_data);
            else if (plan.type === "emergencia")
                warning = verifyEmergencyPlan(plan, metric_data);
            else
                warning = verifyPontualPlan(plan, metric_data);
        }

        return res.status(200).send();
    }
    catch(e)
    {
        console.log(e);
        errorToJson(e, res);
    }
})

// Metrics de um lote
router.get("/:lote", authMiddleware, async (req,res) => {
    try
    {
        const lote_id = req.params.lote;
        if(typeof(lote_id) !== "string") return res.status(400).send();

        const lote = await loteModel.findById(lote_id);
        if(!lote) return res.status(404).send();

        const metrics = (await metricModel.find({ lote: lote._id }).lean()).map(({_id, ...rest}) ({
            id: _id,
            ...rest
        }));

        return res.status(200).json(metrics);
    }
    catch(e)
    {
        console.log(e);
        return res.status(200).send();
    }
})