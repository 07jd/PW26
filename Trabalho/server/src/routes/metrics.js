import { Router } from "express"
import loteModel from "../models/lote.js"
import { errorToJson } from "../util/db.js"
import authMiddleware from "../middleware/authMiddlewares.js";
import metricModel from "../models/metric.js"
import mongoose from "mongoose";
import alertModel from "../models/alerts.js";
import taskModel from "../models/task.js";
import logModel from "../models/log.js";

const route_name = "/metrics";
const router = Router();
export { route_name, router };

// Registrar metrica
router.post("/:lote", authMiddleware, async(req,res) => {
    try
    {
        const lote_num = Number(req.params.lote);
        if(Number.isNaN(lote_num)) return res.status(400).send();

        const lote = await loteModel.findOne({num: lote_num}).populate("plans");
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
        
        // Log action
        await logModel.create({
            user: req.user.id,
            description: `[Metrics] Métrica criada (lote:${lote_num})`
        })

        if (lote.plans.length === 0) return res.status(200).send();

        // Check if already taken action in prev 30m
        if(lote.operationMode === "auto")
        {
            // Find a task where it was done in the latest 30m from now, 
            // doneBy noone, aka, the system
            const latest_task = await taskModel.findOne({ 
                lote: lote._id,
                state: { $eq: "concluido" },
                $or: [
                    { doneBy: null },
                    { doneBy: {$exists: false} },
                ],
                doneAt: {
                    $gte: new Date(Date.now() - (30* 60*1000))
                }
            })

            // Action already taken in the latest 30m
            if(latest_task) return res.status(200).send();
        }
        else
        {
            // Find an alert starting with [Lote %num%] within 30m
            // if so dont create more alerts until passed 30m
            const latest_alert = await alertModel.findOne({
                description: {
                    $regex: `^\\[Lote: ${lote.num}\\]`,
                    $options: "i"
                },
                createdAt: {
                    $gte: new Date(Date.now() - 30*(60*1000))
                }
            });

            if(latest_alert) return res.status(200).send();
        }

        // Take action if values outside of planned
        const getRanges = (plans) => {
            const tempValues = [];
            const lumValues = [];
            const humValues = [];
            
            for(const plan of plans)
            {
                if(plan.type !== "regular") continue;
                
                console.log(plan);
                tempValues.push(plan.temperature.max);
                tempValues.push(plan.temperature.min);
                lumValues.push(plan.luminosity.max);
                lumValues.push(plan.luminosity.min);
                humValues.push(plan.humidity.max);
                humValues.push(plan.humidity.min);
            }

          return {
            temperature: {
                min: Math.min.apply(Math, tempValues),
                max: Math.max.apply(Math, tempValues),
            },
            humidity: {
                min: Math.min.apply(Math, humValues),
                max: Math.max.apply(Math, humValues),
            },
            luminosity: {
                min: Math.min.apply(Math, lumValues),
                max: Math.max.apply(Math, lumValues),
            }
        };
        };

        
        // Sensor data
        const ranges = getRanges(lote.plans);
        const temp = data.temperature;
        const hum = data.humidity;
        const lux = data.luminosity;

        const possible_task = {
            lote: lote._id,
            type: "",
            state: "concluido",
            scheduledFor: new Date(),
            doneAt: new Date(),
        };

        const possible_alert = {
            level: "warning",
            description: "",
        };

        if(temp > ranges.temperature.max || temp < ranges.temperature.min)
        {
            if(lote.operationMode === "manual")
            {
                possible_alert.description = `[Lote: ${lote.num}] Temperatura fora do range desejado (${ranges.temperature.min}-${ranges.temperature.max} Cº)`;
                await alertModel.create(possible_alert);
            }
            else
            {
                possible_task.type = "ventilar";
                await taskModel.create(possible_task)
            }
        }

        if(hum < ranges.humidity.min || hum > ranges.humidity.max)
        {
            if(lote.operationMode === "manual")
            {
                possible_alert.description = `[Lote: ${lote.num}] Humidade fora do range desejado (${ranges.humidity.min}-${ranges.humidity.max} %)`;
                await alertModel.create(possible_alert);
            }
            else
            {
                (hum > ranges.humidity.max) ? possible_task.type = "ventilar" : possible_task.type = "rega";
                await taskModel.create(possible_task)  
            }
        }

        if(lux > ranges.luminosity.max || lux < ranges.luminosity.min)
        {
            if(lote.operationMode === "manual")
            {
                possible_alert.description = `[Lote: ${lote.num}] Luminosidade fora do range desejado (${ranges.luminosity.min}-${ranges.luminosity.max} LUX)`;
                await alertModel.create(possible_alert);
            }
            else
            {
                possible_task.type = "controlo_luz";
                await taskModel.create(possible_task)
            }
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

        // Log action
        await logModel.create({
            user: req.user.id,
            description: `[Metrics] Métrica (${deleted._id}) apagada`
        })

        return res.status(200).send();
    }
    catch(e)
    {
        console.log(e);
        return res.status(500).send();
    }
})