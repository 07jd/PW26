import express from "express";

const port = 8080;
const app = express();
let minhas_notas = [20, 10, 15, 17];

app.use(express.json());

app.get("/", (_req,res) => {
    res.status(200).send("Servidor a funcionar!");
})

app.get("/notas", (_req,res) => {
    res.status(200).json({
        "notas": minhas_notas
    });
})

app.get("/notas/:pos", (req,res) => {
    const idx = req.params.pos;
    if (idx <= 0) return res.status(400).send();
    if(idx>minhas_notas.length) return res.status(404).send();

    return res.status(200).json({
        "nota": minhas_notas[idx-1]
    })
})

app.post("/notas", (req,res) => {
    const number = Number(req.body.nota);
    if(!number) return res.status(400).send();

    minhas_notas.push(number);
    res.status(200).send();
})

app.post("/notas/:pos", (req,res) => {
    const idx = req.params.pos;
    if (idx <= 0) return res.status(400).send();
    if(idx>minhas_notas.length) return res.status(404).send();

    const number = Number(req.body.nota);
    if(!number) return res.status(400).send();

    minhas_notas[idx-1] = minhas_notas[idx-1] + number;
    return res.status(200).send();
})

app.patch("/notas/:pos", (req,res) => {
    const idx = req.params.pos;
    if (idx <= 0) return res.status(400).send();
    if(idx>minhas_notas.length) return res.status(404).send();

    const number = Number(req.body.nota);
    if(!number) return res.status(400).send();

    minhas_notas[idx-1] = number;
    return res.status(200).send();
})

app.delete("/notas/:pos", (req,res) => {
    const idx = req.params.pos;
    if (idx <= 0) return res.status(400).send();
    if(idx>minhas_notas.length) return res.status(404).send();

    minhas_notas.splice(idx-1, 1);
    res.status(200).send();
})

app.delete("/notas", (_req,res) => {
    minhas_notas = [];
    res.status(200).send();
})

app.listen(port, ()=>{
    console.log(`Listening on port: ${port}`);
})