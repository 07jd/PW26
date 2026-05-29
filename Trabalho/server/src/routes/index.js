import { Router } from "express"
import folder from "../util/folder.js";

const route_name = "/";
const router = Router();
export { route_name, router };

// Serve main page
router.get("/", (_req, res) => {
    res.status(200).sendFile(folder.get_page("index.html"));
})