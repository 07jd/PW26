import { Router } from "express"
import loteModel from "../models/lote.js"
import { errorToJson } from "../util/db.js"
import authMiddleware from "../middleware/authMiddlewares.js";
import metricModel from "../models/metric.js"
import mongoose from "mongoose";

const route_name = "/metrics";
const router = Router();
export { route_name, router };

// Registrar metrica
router.post("/:lote", authMiddleware, async(req,res) => {
    try
    {
        const lote_num = Number(req.params.lote);
        if(Number.isNaN(lote_num)) return res.status(400).send();

        const lote = await loteModel.findOne({num: lote_num});
        if(!lote) return res.status(404).send();


        const data = req.body;
        if (!data) return res.status(400).send();

        data.lote = lote._id;
        if(data.luminosity && data.luminosity < 0)
        {
            return res.status(400).json({
                type: "validation",
                errors: {
                    luminosity: "Luminisade deve ser >= 0"
                }
            })
        }

        if(data.humidity && (data.humidity < 0 || data.humidity > 100))
        {
            return res.status(400).json({
                type: "validation",
                errors: {
                    humidity: "Humidade deve ser entre 0 a 100"
                }
            })
        }
        
        if(data.time)
        {
            const custom = new Date(data.time);
            if(isNaN(custom.getTime())) custom = new Date();
            
            custom.setMilliseconds(0);
            data.time = custom;
        }
        else
        {
            const now = new Date();
            now.setMilliseconds(0);
            data.time = now;
        }

        if(new Date() < data.time)
        {
            return res.status(400).json({
                type: "validation",
                errors: {
                    time: "Tempo de registro inválido"
                }
            });
        }

        await metricModel.create(data);
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
        const lote_num = Number(req.params.lote);
        if(Number.isNaN(lote_num)) return res.status(400).send();

        const lote = await loteModel.findOne({ num: lote_num });
        if(!lote) return res.status(404).send();

        const metrics = (await metricModel.find({ lote: lote._id }).sort({ time: -1 }).lean()).map(
          ({ _id, ...rest }) => ({
            id: _id,
            ...rest,
          })
        );

        return res.status(200).json(metrics);
    }
    catch(e)
    {
        console.log(e);
        return res.status(500).send();
    }
})

// Apagar metricas de um lote
router.delete("/:id", authMiddleware, async (req,res) => {
    try
    {
        const id = req.params.id;
        if(!mongoose.isValidObjectId(id)) return res.status(400).send();

        const deleted = await metricModel.findByIdAndDelete(id);
        if(!deleted) return res.status(404).send();

        return res.status(200).send();
    }
    catch(e)
    {
        console.log(e);
        return res.status(500).send();
    }
})