import { Router } from "express"
import multer from "multer"
import fs from "fs"
import csv from "csv-parser"
import authMiddleware from "../middleware/authMiddlewares.js"
import herbModel from "../models/herb.js"
import { errorToJson } from "../util/db.js"
import mongoose from "mongoose"

const route_name = "/herb";
const router = Router();
export { route_name, router };

const upload = multer({ dest: "uploads/" });

// Create herb
router.post("/", authMiddleware, async (req,res) => {
    try
    {
        const data = req.body;
        if(!data) return res.status(400).send();

        data.createdBy = req.user.id;
        data.updatedBy = req.user.id;
        console.log(data);
        await herbModel.create(data);

        res.status(200).send();
    }
    catch(e) { errorToJson(e, res); }
})

// Create a batch of herbs from a csv file
router.post("/upload", authMiddleware, upload.single("file"), async (req,res) => {
    // TODO: Parse
    if(!req.file || !req.file.path) return res.status(400).send();
    
    const path = req.file.path;
    const user_id = req.user.id;
    console.log(req.file);
    try
    {
        // TODO: Parsing
        fs.unlinkSync(path);
        res.status(400).send();
    }
    catch(e)
    {
        console.log(e);
        return res.status(500).send();
    }
})

// Change herb parameters via id
router.patch("/:id", authMiddleware, async (req,res) => {
    try
    {
        const id = req.params.id;
        const data = req.body;
        if(!data) return res.status(400).send();

        // Append who updated this herb
        delete data.createdBy;
        data.updatedBy = req.user.id;

        const herb = await herbModel.findOneAndUpdate(
            { _id: id },
            { $set: data },
            { returnDocumentAfter: true, runValidators: true}
        );

        if (!herb) return res.status(404).send();
        res.status(200).send();
    }
    catch(e)
    {
        errorToJson(e, res);
    }
})

// Get by id
router.get("/:id", authMiddleware, async (req, res) => {
    try
    {
        const herb_id = req.params.id;
        if(!mongoose.isValidObjectId(herb_id)) return res.status(400).send();

        const herb = await herbModel.findById(herb_id).lean();
        if(!herb) return res.status(404).send();

        const clean = {
            id: herb._id,
            ...herb
        };
        delete clean._id;

        return res.status(200).json(clean);
    }
    catch
    {
        return res.status(500).send();
    }
});

// Get array of all herbs
router.get("/", authMiddleware, async (_req,res) => {
    try
    {
        const herbs = (await herbModel.find({}).sort({ createdAt: -1 })
            .populate("createdBy", "_id username email")
            .populate("updatedBy", "_id username email")
            .lean()
        )
        .map(({_id, createdBy, updatedBy, ...rest}) => ({
            id: _id,
            ...rest,
            createdBy: createdBy && {
                id: createdBy._id,
                username: createdBy.username,
                email: createdBy.email,
            },
            updatedBy: updatedBy && {
                id: updatedBy._id,
                username: updatedBy.username,
                email: updatedBy.email,
            }
        }));

        return res.status(200).json(herbs);
    }
    catch
    {
        return res.status(500).send();
    }
});