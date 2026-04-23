import express from "express"
import fs from "fs"
import folder from "../utils/folder.js";

const route_name = "/clientes";
const router = express.Router();
export {route_name, router};

function lerFicheiroJSON()
{
    const data = fs.readFileSync(folder.shared + "/consumos.json");
    return JSON.parse(data);
};

function guardarFicheiroJSON(input_data)
{
    const data = JSON.stringify(input_data, 0, 4);
    fs.writeFileSync(folder.shared + "/consumos.json", data);
}

// 200 - Devolve conteudo inteiro do ficheiro
router.get("/", (_req,res) => {
    res.status(200).json(lerFicheiroJSON());
})

// 200 - Devolve conteudo associado ao cliente com o id fornecido
// 404 - Cliente nao encontrado
router.get("/:id", (req,res) => {
    const dados = lerFicheiroJSON();

    const cliente = dados.find(obj => obj.clienteId === req.params.id);
    if(cliente) return res.status(200).json(cliente);
    res.status(404).json({ erro : "Cliente nao foi encontrado"});
})

// 200 - Cliente adicionado
// 400 - Data inválida
// 409 - Já existe um cliente com esse ID
router.post("/", (req,res) => {
    const cliente = req.body;
    if (!cliente || !cliente.clienteId || !cliente.nome || !cliente.endereco || !cliente.consumo) return res.status(400).send();
    
    const data = lerFicheiroJSON();
    const dup = data.find(obj => obj.clienteId === cliente.clienteId);
    if(dup) return res.status(409).send();

    data.push(cliente);
    guardarFicheiroJSON(data);
    res.status(200).send();
})

// 200 - Consumo adicionado ao cliente de ID fornecido
// 404 - Cliente não encontrado
router.post("/:id/adicionarConsumo", (req,res) => {
    const dados = lerFicheiroJSON();
    const novo_consumo = req.body;

    const cliente = dados.find(obj => obj.clienteId === req.params.id);
    if(!cliente) return res.status(404).json({ erro : "Cliente nao foi encontrado"});
    
    cliente.consumo.push(novo_consumo);
    guardarFicheiroJSON(dados);
    res.status(200).send();
})

// 200 - Endereço associado ao cliente de ID fornecido alterado
// 404 - Cliente nao encontrado
router.patch("/:id/atualizarEndereco", (req,res) => {
    const dados = lerFicheiroJSON();
    const novo_endereço = req.body;

    const cliente = dados.find(obj => obj.clienteId === req.params.id);
    if(!cliente) return res.status(404).json({ erro : "Cliente nao foi encontrado"});
    
    cliente.endereco = novo_endereço;
    guardarFicheiroJSON(dados);
    res.status(200).send();
})

// 200 - Consumo apagado
// 400 - Index inválido
// Obs: index é 1 based
router.delete("/:id/consumo/:idx", (req,res) => {
    const dados = lerFicheiroJSON();
    const cliente = dados.find(obj => obj.clienteId === req.params.id);
    if(!cliente) return res.status(404).json({ erro : "Cliente nao foi encontrado"});
    
    const idx = parseInt(req.params.idx);
    if(isNaN(idx) || idx <= 0 || idx > cliente.consumo.length) return res.status(400).json({ erro: "Index invalido"});
    
    cliente.consumo.splice(idx-1,1);
    guardarFicheiroJSON(dados);
    res.status(200).send();
})