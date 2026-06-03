import { Router } from "express"
import authMiddleware from "../middleware/authMiddlewares.js"
import { adminPage } from "../middleware/roleMiddlewares.js"
import logModel from "../models/log.js";

const route_name = "/logs";
const router = Router();
export { route_name, router };

router.get("/", authMiddleware, adminPage, async (_, res) => {
    try
    {
        const logs = await logModel.find();
        return res.status(200).json(logs);
    }
    catch
    {
        return res.status(500).send();
    }
});