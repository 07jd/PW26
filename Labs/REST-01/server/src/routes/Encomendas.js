import express from "express"
import connect from "../utils/db.js"
import { ObjectId } from "mongodb"
import Ajv from "ajv"
import { encomendaPostSchema, encomendaPatchSchema } from "../schemas/EncomendaSchemas.js"
const route_name = "/encomendas";
const router = express.Router();
export {route_name, router};


const ajv = new Ajv();
const db = await connect();
const clientes = db.collection("clientes");
const encomendas = db.collection("encomendas");

// _id to id
function dbResultToSchema(json)
{
    if (Array.isArray(json))
    {
        return json.map(entry => {
            const new_entry = {
                id: entry._id,
                ...entry
            };
            delete new_entry._id;

            return new_entry
        })
    }
    else
    {
        const return_json = 
        {
            id: json._id,
            ...json
        };
        delete return_json._id;
        return return_json;
    }
}

// Obter todas as encomendas
// 200 -> Devolve lista de todas as encomendas
// 500 -> Internal server error
router.get("/", async (_req,res) => {
    try
    {
        const result = await encomendas.find({}).toArray();
        res.status(200).json(dbResultToSchema(result)); 
    }
    catch(e)
    {
        console.log("Failed getting all encomendas, err msg: " + e.message);
        res.status(500).send();
    }
});

// Adicionar uma encomenda
// 200 -> Sucesso
// 400 -> Input inválido (JSON)
// 404 -> Cliente nao encontrado (ref no JSON)
// 500 -> Internal server error
router.post("/", async (req,res) => {
    const encomendaData = req.body;
    const validData = ajv.validate(encomendaPostSchema, encomendaData);
    if(!validData) return res.status(400)

    try
    {
        if (!ObjectId.isValid(encomendaData.clienteID)) return res.status(400).send();
        const user = await clientes.findOne({ _id : new ObjectId(encomendaData.clienteID) });
        if(!user) return res.status(404).send();

        await encomendas.insertOne({
            requested_at: new Date(),
            ...encomendaData,
            estado: "pendente",
            completa: false
        });

        res.status(200).send();
    }
    catch(e)
    {
        console.log("Error inserting new encomenda in mongoDB, err msg: " + e.message);
        res.status(500).send();
    }
})

// Obter detalhes de uma encomenda via ID
// 200 -> Sucesso, retorna detalhes da encomenda
// 400 -> ID invalido
// 404 -> Encomenda não encontrada
// 500 -> Internal server error
router.get("/:id", async (req,res) => {
    const encomenda_id = req.params.id;
    try
    {
        if(!ObjectId.isValid(encomenda_id)) return res.status(400).send();
        const encomenda = await encomendas.findOne({ _id: new ObjectId(encomenda_id) });
        if(!encomenda) return res.status(404).send();

        res.status(200).json(dbResultToSchema(encomenda));
    }
    catch(e)
    {
        console.log("Error getting encomenda info by it's id, err msg: " + e.message);
        res.status(500).send();
    }
})

// Cancela uma encomenda via ID
// 200 -> Sucesso
// 400 -> ID invalido
// 404 -> Encomenda nao encontrada
// 500 -> Internal server error
router.post("/:id/cancel", async (req,res) => {
    const encomenda_id = req.params.id;
    try
    {
        if(!ObjectId.isValid(encomenda_id)) return res.status(400).send();
        const encomenda = await encomendas.findOne({ _id: new ObjectId(encomenda_id) });
        if(!encomenda) return res.status(404).send();

        await encomendas.updateOne({ _id : new ObjectId(encomenda_id)}, { $set : { estado: "cancelada" }});
        res.status(200).send();
    }
    catch(e)
    {
        console.log("Error canceling encomenda by it's id, err msg: " + e.message);
        res.status(500).send();
    }
})

// Atualizar conteudo de uma encomenda
// 200 -> Sucesso
// 400 -> JSON/ID de encomenda inválido
// 404 -> Encomenda nao encontrada
// 409 -> Conteudo da encomenda nao pude ser alterada, estado != pendente 
// 500 -> Internal server error
router.patch("/:id", async (req,res) => {
    const encomendaID = req.params.id;
    const encomendaContentData = req.body;
    const validData = ajv.validate(encomendaPatchSchema, encomendaContentData);
    if(!validData) return res.status(400).send();

    try
    {
        if (!ObjectId.isValid(encomendaID)) return res.status(400).send();
        const encomendaDB = await encomendas.findOne({ _id : new ObjectId(encomendaID) });
        if(!encomendaDB) return res.status(404).send();
        if (encomendaDB.estado !== "pendente") return res.status(409).send();

        await encomendas.updateOne({ _id : new ObjectId(encomendaID) }, { $set: { content: encomendaContentData.content } });
        res.status(200).send();
    }
    catch(e)
    {
        console.log("Error patching encomenda content in mongoDB, err msg: " + e.message);
        res.status(500).send();
    }
})

// Atualizar todos os dados de uma encomenda
// 200 -> Sucesso
// 400 -> JSON/ID de encomenda inválido
// 404 -> Encomenda nao encontrada
// 500 -> Internal server error
router.put("/:id", async (req,res) => {
    const encomendaID = req.params.id;
    const encomendaNewData = req.body;
    const validData = ajv.validate(encomendaPostSchema, encomendaNewData);
    if(!validData) return res.status(400).send();

    try
    {
        if (!ObjectId.isValid(encomendaID)) return res.status(400).send();
        const encomendaDB = await encomendas.findOne({ _id : new ObjectId(encomendaID) });
        if(!encomendaDB) return res.status(404).send();

        // Validar novo clienteID
        if(!ObjectId.isValid(encomendaNewData.clienteID)) return res.status(400).send();
        const cliente = await clientes.findOne({ _id: new ObjectId(encomendaNewData.clienteID) });
        if (!cliente) return res.status(400).send();

        await encomendas.updateOne({ _id : new ObjectId(encomendaID) }, { $set: { 
            requested_at: new Date(), 
            content: encomendaNewData.content, 
            clienteID: encomendaNewData.clienteID, 
            completa: false, 
            estado: "pendente" 
        } });
        res.status(200).send();
    }
    catch(e)
    {
        console.log("Error updating encomenda content in mongoDB, err msg: " + e.message);
        res.status(500).send();
    }
})