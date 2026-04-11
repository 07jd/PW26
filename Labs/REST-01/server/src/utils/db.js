import cfg from "../config.js"
import {MongoClient} from "mongodb"


const db_client = new MongoClient(cfg.db_uri);
// pra evitar fz multiplas conecçoes
let db = null;

async function connect() 
{
    if (db) return db;

    await db_client.connect();
    db = db_client.db(cfg.db_table);
    
    console.log("[Ok] Db conectada.");
    return db;   
}

export default connect;