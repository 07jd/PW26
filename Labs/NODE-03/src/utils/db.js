import mongoose from "mongoose"

const db_uri = "mongodb://localhost:27017/labRest03";
let db = null;

async function connect()
{
    if(!db)
    {
        db = await mongoose.connect(db_uri);
        console.log("[Ok] Db connectada");
    }

    return db;
}

export default connect;