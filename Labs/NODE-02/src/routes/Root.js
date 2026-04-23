import express from "express"
import folder from "../utils/folder.js";
import path from "path"

const route_name = "/";
const router = express.Router();
export {route_name, router};

const homepage = path.join(folder.public, "index.html");
router.get("/", (_req, res) => {
    res.status(200).sendFile(homepage);
});