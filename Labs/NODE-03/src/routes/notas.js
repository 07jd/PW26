import express from "express"
import notas from "../models/notas.js"

const route_name = "/notas";
const router = express.Router();
export {route_name, router};

// 200 -> Obtem todas as notas
// 500 -> Erro
router.get("/", async (_,res) => {
    try
    {
        const result = await notas.find(); 
        res.status(200).json(result);
    }
    catch(e)
    {
        res.status(500).json({ erro: e.message });
    }
});

// 200 -> Adicionado com sucesso
// 400 -> Data invalida
router.post("/", async (req,res) => {
    try
    {
        const nova_entry = await notas.create(req.body);
        res.status(201).json(nova_entry);
    }
    catch(e)
    {
        res.status(400).json({ erro: e.message });
    }
})

// 200 -> Data
// 404 -> Not Found
// 500 -> Erro
router.get("/:id", async (req,res) => {
    try
    {
        const result = await notas.findById(req.params.id);
        if(!result)
            return res.status(404).send();

        res.status(200).json(result);
    }
    catch(e)
    {
        res.status(500).json({ erro: e.message });
    }
})

// 200 -> Sucesso
// 404 -> Not found
// 500 -> Erro
router.put("/:id", async (req,res) => {
    try
    {
        const result = await notas.findByIdAndUpdate(req.params.id, req.body, { returnDocument: "after", runValidators: true});
        if (!result) return res.status(404).send();
        res.status(200).json(result);
    }
    catch(e)
    {
        res.status(500).json({ erro: e.message });
    }
})

// 200 -> sucesso
// 500 -> erro
router.delete("/:id", async (req,res) => {
    try
    {
        const result = await notas.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).send();
        res.status(200).send();
    }
    catch(e)
    {
        res.status(500).json({ erro: e.message });
    }
})