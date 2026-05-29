import { Router } from "express"
import { redirectToDashboard } from "../middleware/authMiddlewares.js"
import folder from "../util/folder.js"

const route_name = "/auth";
const router = Router();
export { route_name, router };

router.get("/", redirectToDashboard, (_, res) => {
    res.status(200).sendFile(folder.get_page("auth.html"));
})