import { Router } from "express"
import alertModel from "../models/alerts.js";
import authMiddleware from "../middleware/authMiddlewares.js"
import { adminPage } from "../middleware/roleMiddlewares.js";
import mongoose from "mongoose";
import { errorToJson } from "../util/db.js";

const route_name = "/alert";
const router = Router();
export { route_name, router };

// Get all ACTIVE alerts assigned to user role
router.get("/", authMiddleware, async (req,res) => {
    try
    {
        const role = req.user.role;
        const alerts = (await alertModel.find({ roles: role, status: "ativo"}).sort({ timestamp: -1 }).lean()).map(({ _id, ...rest}) => ({
            id: _id,
            ...rest
        }));

        return res.status(200).json(alerts);
    }   
    catch(e)
    {
        return res.status(500).send();
    }
})

// Gets all alerts assigned to user role
router.get("/everything", authMiddleware, async (req,res) => {
    try
    {
        const role = req.user.role;
        const alerts = (await alertModel.find({ roles: role }).sort({ timestamp: -1 }).lean()).map(({ _id, ...rest}) => ({
            id: _id,
            ...rest
        }));

        return res.status(200).json(alerts);
    }   
    catch(e)
    {
        return res.status(500).send();
    }
})

// Get all alerts across all roles
router.get("/all", authMiddleware, adminPage, async (_req, res) => {
    try
    {
        const alerts = (await alertModel.find().lean()).map(({_id, ...rest}) => ({
            id: _id,
            ...rest
        }));

        return res.status(200).json(alerts);
    }
    catch(e)
    {
        console.log(e);
        return res.status(500).send();
    }
})

// Change status of an alert
router.post("/:id", authMiddleware, async (req,res) => {
    try
    {
        const id = req.params.id;
        if(!mongoose.isValidObjectId(id)) return res.status(400).send();
        
        const alert = await alertModel.findOneById(id);
        if(!alert) return res.status(404).send();
        if(!alert.roles.includes(req.user.role)) return res.status(403).send();

        // Alerta já resolvido
        if (alert.status !== "ativo") return res.status(200).send();
        
        const raw = req.body;

        if(!raw.status) return res.status(400).json({
            type: "validation",
            errors: {
                status: "Novo estado em falta"
            }
        });

        // Can't change to active
        if(raw.status === "ativo") return res.status(400).json({
            type: "validation",
            errors: {
                status: "Novo estado não deve ser do tipo ativo"
            }
        });

        if(raw.status === "ignorado" && !raw.ignoreReason) return res.status(400).json({
            type: "validation",
            errors: {
                ignoreReason: "Parametro em falta"
            }
        });

        const data = {
            status: raw.status,
            resolvedBy: req.user.role,
        };

        if(raw.status === "ignorado") data.ignoreReason = raw.ignoreReason;


        Object.assign(alert, data);
        await data.save();

        return res.status(200).send();
    }
    catch(e)
    {
        console.log(e);
        errorToJson(e, res);
    }
})