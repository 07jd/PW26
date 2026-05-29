import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
    level: {
        type: String,
        enum: {
            values: ["info", "warning", "urgent"],
            message: "Nivel incorreto"
        },
        required: true
    },
    roles: {
        type: [String],
        enum: {
            values: ["Técnico", "Responsável", "Administrador"],
            message: "Role inválido"
        },
        default: ["Técnico", "Responsável", "Administrador"],
        required: true
    },
    status: {
        type: String,
        enum: {
            values: ["ativo", "resolvido", "ignorado"],
            message: "Estado inválido"
        },
        default: "ativo"
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    ignoreReason: {
        type: String,
        trim: true
    }
}, { timestamps: true });

const alertModel = new mongoose.model("alert", alertSchema);
export default alertModel;