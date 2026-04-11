import express from "express"
import connect from "../utils/db.js"
import Ajv from "ajv"
import {clientePostSchema} from "../schemas/ClienteSchemas.js"
import { ObjectId } from "mongodb";
const route_name = "/clientes";
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

// Obter todos os clientes
// 200 -> Sucesso, retorna uma lista com as informaçoes de todos os clientes
// 500 -> Internal server error
router.get("/", async (_req, res)=> {
    try
    {
        const result = await clientes.find({}).toArray();
        res.status(200).json(dbResultToSchema(result));
    } 
    catch(e)
    {
        console.log("Failed to get all clients from mongoDB. Error: " + e.message);
        res.status(500).send();
    }
});

// Registar um cliente na Db
// 200 -> Sucesso, retorna info do cliente
// 400 -> JSON de input inválido
// 409 -> Parametros duplicados, retorna {code,msg} (ocorre qnd já existe um parametro registrado a outro cliente)
// 500 -> Internal server error
router.post("/", async (req, res) => {
    const new_user = req.body;
    const validData = ajv.validate(clientePostSchema, new_user);
    if (!validData) return res.status(400).send();

    try
    {
        const duplicate = await clientes.findOne({
            $or: [{username: new_user.username}, {email: new_user.email}, {telefone: new_user.telefone}]
        });

        if (duplicate)
        {
            let msg;
            if (duplicate.username === new_user.username)
            {
                msg = "Username in use.";
            }
            else if (duplicate.email == new_user.email)
            {
                msg = "Email already in use";
            }
            else
            {
                msg = "Telefone already in use";
            }            return res.status(409).json({
                "code": "2",
                "message": msg
            });
        }
        const result_db = await clientes.insertOne(new_user);
        const return_user = 
        {
            id: result_db.insertedId,
            ...new_user
        };
        res.status(200).json(return_user);
    } 
    catch (e)
    {
        console.log("Failed to insert client into mongoDB: " + e.message);
        res.status(500).send();
    }
});

// Obter dados de um cliente via ID
// 200 -> Sucesso, retorna a info do cliente
// 400 -> ID de cliente inválido
// 404 -> Cliente não encontrado
// 500 -> Internal server error
router.get("/:user_id", async (req,res) => {
    const user_id = req.params.user_id;
    try
    {
        if(!ObjectId.isValid(user_id)) return res.status(400).send();

        const user = await clientes.findOne({ _id : new ObjectId(user_id) });
        if(user)
            res.status(200).json(dbResultToSchema(user));
        else
            res.status(404).send();
    }
    catch(e)
    {
        console.log("Failed to get info of a client based on his id (" + user_id +"), err msg: " + e.msg);
        res.status(500).send();
    }
});

// Atualizar dados de um cliente via ID
// 200 -> Sucesso, nada retornado
// 400 -> invalid id/json
// 409 -> duplicate param, another user already has that (code,msg)
// 500 -> Internal server error
router.put("/:user_id", async (req,res) => {
    const user_id = req.params.user_id;
    const new_data = req.body;
    const validData = ajv.validate(clientePostSchema, new_data);

    if(!validData) return res.status(400).send();
    try
    {
        if(!ObjectId.isValid(user_id)) return res.status(400).send();
        const user = await clientes.findOne({ _id : new ObjectId(user_id) });

        const duplicate = await clientes.findOne({
            _id: { $ne: user._id },
            $or: [{username: new_data.username}, {email: new_data.email}, {telefone: new_data.telefone}]
        });

        if (duplicate)
        {
            let msg;
            if (duplicate.username === new_data.username)
            {
                msg = "Username already in use.";
            }
            else if (duplicate.email == new_data.email)
            {
                msg = "Email already in use";
            }
            else
            {
                msg = "Telefone already in use";
            }

            return res.status(409).json({
                "code": "2",
                "message": msg
            });
        }

        await clientes.updateOne({ _id: new ObjectId(user_id) }, { $set: new_data });
        res.status(200).send();
    }
    catch(e)
    {
        console.log("Failed updating client data based on id ("+user_id+"), err msg: " + e.msg);
        res.status(500).send();
    }
})

// Obter todas as encomendas de um cliente via ID
// 200 -> Sucess, devolve uma lista com todas as encomendas associadas ao cliente 
// 400 -> ID de cliente inválido
// 404 -> Cliente não encontrado
// 500 -> Internal server error
router.get("/:user_id/encomendas", async (req,res) => {
    const user_id = req.params.user_id;
    try
    {
        if (!ObjectId.isValid(user_id)) return res.status(400).send();
        const user = await clientes.findOne({ _id : new ObjectId(user_id) });
        if (!user) return res.status(404).send();

        const lista_encomendas = await encomendas.find({ clienteID : user_id }).toArray();
        res.status(200).json(dbResultToSchema(lista_encomendas));
    }
    catch(e)
    {
        console.log("Error getting client encomendas based on his id ("+user_id+"), err msg: " + e.msg);
        res.status(500).send();
    }
});

// Cancelar todas as encomendas de um cliente via ID
// 200 -> Sucesso
// 400 -> ID de cliente inválido
// 404 -> Cliente não encontrado
// 500 -> Internal server error
router.post("/:user_id/encomendas/cancel-all", async (req,res) => {
    const user_id = req.params.user_id;
    try
    {
        if (!ObjectId.isValid(user_id)) return res.status(400).send();
        const user = await clientes.findOne({ _id : new ObjectId(user_id) });
        if (!user) return res.status(404).send();
        await encomendas.updateMany({ clienteID: user_id }, { $set: { estado: "cancelada" } });
        res.status(200).send();
    }
    catch(e)
    {
        console.log("Failed canceling all client's orders based on his id ("+user_id+"), err msg: " + e.msg);
        res.status(500).send();
    }
});

// Apgar um cliente da DB via ID
// 200 -> Sucesso
// 400 -> ID de cliente inválido
// 404 -> Cliente não encontrado
// 500 -> Internal server error
router.delete("/:user_id", async (req,res) => {
    const user_id = req.params.user_id;
    try
    {
        if (!ObjectId.isValid(user_id)) return res.status(400).send();
        const result = await clientes.deleteOne({ _id: new ObjectId(user_id) });
        if (result.deletedCount == 0)
            res.status(404).send();
        else
            res.status(200).send();
    }
    catch(e)
    {
        console.log("Failed deleting a cliend based on his id ("+user_id+"), err msg: " + e.msg);
        res.status(500).send();
    }
});