import { Router } from "express"
import authMiddleware from "../middleware/authMiddlewares.js"
import loteModel from "../models/lote.js";
import mongoose from "mongoose";
import taskModel from "../models/task.js";
import { errorToJson } from "../util/db.js";
import logModel from "../models/log.js";

const route_name = "/task";
const router = Router();
export { route_name, router };

router.get("/:lote", authMiddleware, async (req,res) => {
    try
    {
        const lote_num = Number(req.params.lote);
        if(Number.isNaN(lote_num)) return res.status(400).send();

        const lote = await loteModel.findOne({ num: lote_num });
        if(!lote) return res.status(404).send();

        const tasks = (await taskModel.find({
          lote: lote._id
        }).populate("doneBy", "username email").lean()).map(({ _id, ...rest }) => ({
          id: _id,
          ...rest,
        }));

        
        return res.status(200).json(tasks);
    } catch (e)
    {
        console.log(e);
        return res.status(500).send();
    }
})

router.post("/:lote", authMiddleware, async (req,res) => {
    try
    {
        const lote_num = Number(req.params.lote);
        const data = req.body;        
        if(Number.isNaN(lote_num) || !data) return res.status(400).send();

        const lote = await loteModel.findOne({num: lote_num});
        if(!lote) return res.status(404).send();
        data.lote = lote._id;

        delete data.doneBy;
        if(data.state === "concluido"){
            data.doneBy = req.user.id;
            if(!data.doneAt || new Date(data.doneAt) > new Date())
            {
                return res.status(400).json({
                    type: "validation",
                    errors: {
                        doneAt: "Tempo de términio inválido"
                    }
                });
            }
        };

        const tk = await taskModel.create(data);

        // Log action
        await logModel.create({
            user: req.user.id,
            description: `[Tasks] Tarefa (${tk.type}) criada`
        })

        return res.status(200).send();
    }
    catch(e)
    {
        console.log(e);
        errorToJson(e, res);
    }
})

router.delete("/:id", authMiddleware, async (req, res) => {
    try
    {
        const id = req.params.id;
        if(!mongoose.isValidObjectId(id)) return res.status(400).send();

        const deleted = await taskModel.findByIdAndDelete(id);
        if(!deleted) return res.status(404).send();

        // Log action
        await logModel.create({
            user: req.user.id,
            description: `[Tasks] Tarefa (${deleted.type}) apagada`
        })

        return res.status(200).send();
    }
    catch
    {
        return res.status(500).send();
    }
})

router.patch("/:id", authMiddleware, async (req,res) => {
    try
    {
        const id = req.params.id;
        const data = req.body;
        if(!mongoose.isValidObjectId(id) || !data) return res.status(400).send();

        const task = await taskModel.findById(id);
        if(!task) return res.status(404).send();

        // ScheduledFor no futuro
        if(data.scheduledFor && new Date(data.scheduledFor) > new Date())
        {
            return res.status(400).json({
                type: "validation",
                errors: {
                    scheduledFor: "Data inválida"
                }
            });
        }

        // DoneAt no futuro
        if(data.doneAt && new Date(data.doneAt) > new Date())
        {
            return res.status(400).json({
                type: "validation",
                errors: {
                    doneAt: "Data inválida"
                }
            });
        }

        delete data.doneBy;
        if(data.state && data.state === "concluido") data.doneBy = req.user.id;

        Object.assign(task, data);
        await task.save();

        // Log action
        await logModel.create({
            user: req.user.id,
            description: `[Tasks] Tarefa (${task.type}) modificada`
        })

        return res.status(200).send();
    }
    catch(e)
    {
        console.log(e);
        errorToJson(e, res);
    }
})