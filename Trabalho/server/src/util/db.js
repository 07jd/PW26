import mongoose from "mongoose";

async function connectDB(uri)
{
    try
    {
        await mongoose.connect(uri);
        console.log(`[Ok] MongoDB connected @${uri}`);
    }
    catch (e)
    {
        console.log(`[Error] Can't connect to mongoDB @${uri}\n\tReturned error:\n\t\t${e}`);
        process.exit(1);
    }
}

export function errorToJson(e, res)
{
    if (e.name === "ValidationError")
    {
        const message = {
            type: "validation",
            errors: {}
        };

        const errors_json = message.errors;
        const moongoose_errors = e.errors;  
        Object.keys(moongoose_errors).forEach((key) => {
            // Cast errors
            if (moongoose_errors[key].message.includes("Cast"))
                errors_json[key] = "Tipo do valor fornecido é inválido";
            else
                errors_json[key] = moongoose_errors[key].message;
        });

        return res.status(400).json(message);
    }
    else if (e.name === "CastError")
    {
        return res.status(400).json({
            type: "validation",
            errors: {
                [e.path]: "Tipo do valor fornecido é inválido"
            }
        });
    }
    else if(e.cause?.code == 11000)
    {
        const dup_field = Object.keys(e.cause.keyValue)[0];
        const dup_value = Object.values(e.cause.keyValue)[0];
        const message = {
            type: "duplicated",
            errors: {
                [dup_field]: `${dup_value} já em uso`
            }
        };

        return res.status(400).json(message);
    }
    else
    {
        const message = {
            type: "server",
            errors: {
                message: "Tente mais tarde"
            }
        };

        return res.status(500).json(message);
    }
}

export default connectDB;