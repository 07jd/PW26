import { Router } from "express"
import folder from "../util/folder.js";
import { redirectToAuth } from "../middleware/authMiddlewares.js"

const route_name = "/dashboard";
const router = Router();
export { route_name, router };

router.use("/:page", (_,res) => {
    res.redirect("/dashboard");
});

router.get("/", redirectToAuth, (_, res) => {
    res.status(200).sendFile(folder.get_page("dashboard.html"));
});