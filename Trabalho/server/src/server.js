import fs from "fs";
import path from "path";
import folder from "./util/folder.js";
import cookieParser from "cookie-parser";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./util/db.js";
import { runBackgroundJob } from "./util/runner.js";

// Load variables from .env
function validate_variables() {
  const variables = ["PORT", "DB", "JWT_SECRET_ACCESS", "JWT_SECRET_REFRESH"];
  for (const value of variables) {
    const retrieved = process.env[value];
    if (retrieved == undefined) {
      console.log(`[Error] Can't find variable \"${value}\" in .env`);
      process.exit(1);
    }
  }
}
dotenv.config();
validate_variables();
const DB_URI = process.env.DB;
await connectDB(DB_URI);

// Start & Setup server
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(folder.public));

// Register routes dynamically
async function registerRoutes() {
  let files = fs.readdirSync(folder.routes).filter((f) => f.endsWith(".js"));

  console.log(`[Ok] Detected files in \"/routes\": [${files}]`);
  const registred_routes = [];
  for (const js_file of files) {
    const route = path.join(folder.routes, js_file);
    const module = await import(route);

    if (module.route_name && module.router) {
      if (registred_routes.includes(module.route_name)) {
        console.log(
          `[Error] Tried to register an already existing route!\n\tRoute Name: \"${module.route_name}\"\n\tFile (2nd reg. attempt): \"${js_file}\"`,
        );
        console.log(`[Error] Exiting`);
        process.exit(1);
      }
      registred_routes.push(module.route_name);

      app.use(module.route_name, module.router);
      console.log(
        `[Ok] Registred route \"${module.route_name}\" from file \"${js_file}\"`,
      );
    } else {
      console.log(
        `[Error] Failed parsing route in the file: \"${js_file}\".\n\tCheck if you are exporting the following variables { route_name, router }.`,
      );
      console.log(`[Error] Exiting...`);
      process.exit(1);
    }
  }
}
await registerRoutes();

// Route not found
app.use((_, res) => {
  res.status(404).send("404 not found");
});

// Run background job each 5m 
runBackgroundJob();

const SERVER_PORT = process.env.PORT;
app.listen(SERVER_PORT, () => {
  console.log(`[Ok] Server started at ${SERVER_PORT}`);
});
