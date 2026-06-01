import { Router } from "express"
import authMiddleware from "../middleware/authMiddlewares.js"
import loteModel from "../models/lote.js";
import mongoose from "mongoose";
import taskModel from "../models/task.js";
import { errorToJson } from "../util/db.js";

const route_name = "/task";
const router = Router();
export { route_name, router };

router.get("/:lote", authMiddleware, async (req,res) => {
    try
    {
        const lote_id = req.params.lote;
        if(!mongoose.isValidObjectId(lote_id)) return res.status(400).send();

        const lote = await loteModel.findById(lote_id);
        if(!lote) return res.status(404).send();

        const tasks = await taskModel.find({
            lote: lote._id,
            state: { $ne: "concluido" }
        }).lean().map(({_id, ...rest}) => ({
            id: _id,
            ...rest
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
        const lote_id = req.params.lote;
        if(!mongoose.isValidObjectId(lote_id)) return res.status(400).send();

        const lote = await loteModel.findById(lote_id);
        if(!lote) return res.status(404).send();
        
        await taskModel.create(data);
        return res.status(200).send();
    }
    catch(e)
    {
        errorToJson(e, res);
    }
})