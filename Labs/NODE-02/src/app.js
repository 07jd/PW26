import fs from "fs"
import path from "path"
import express from "express" 
import cors from "cors"

import cfg from "./config.js"
import folder from "./utils/folder.js"

// Helper func
// Reads all .js files inside /routes and imports them, throws error if duplicated route_name or invalid exported object
async function registerRoutes()
{
    let files = fs.readdirSync(folder.routes).filter(f => f.endsWith(".js"));
    
    console.log(`[Ok] Detected files in \"/routes\": [${files}]`);  
    const registred_routes = [];
    for(const js_file of files)
    {
        const route = path.join(folder.routes, js_file);
        const module = await import(route);

        if (module.route_name && module.router)
        {
            if (registred_routes.includes(module.route_name)) throw new Error(`Tried to register an already existing route!\n\tRoute Name: \"${module.route_name}\"\n\tFile (2nd reg. attempt): \"${js_file}\"`)
            registred_routes.push(module.route_name);

            app.use(module.route_name, module.router);
            console.log(`[Ok] Registred route \"${module.route_name}\" from file \"${js_file}\"`);
        }
        else
        {
            const raw = JSON.stringify(module);
            throw new Error(`Failed parsing route in the file: \"${js_file}\".\n\tCheck if you are exporting the following {route_name,router}.\n\tRaw Obj:\n\t\t${raw}`);
        }
    }  
};

const app = express();
app.use(cors({
    origin: "*"
}));
app.use(express.json());
app.use(express.static(folder.public));
await registerRoutes();

// Handle unregistred routes
app.use((_req,res) => {
    res.status(404).send("not found");
});

app.listen(cfg.port, () => {
    console.log(`[Ok] Iniciado em localhost:${cfg.port}`);
});

