import express from "express"

const route_name = "/";
const router = express.Router();
export {route_name, router};

router.get("/", (_req,res) => {
    res.status(200).send("Main page");
});