import mongoose from "mongoose"

const taskSchema = new mongoose.Schema({
    lote: {
        type: mongoose.Types.ObjectId,
        ref: "lote",
        required: [true, "Forneça o id do lote"]
    },
    type: {
        type: String,
        required: [true, "Forneça o tipo da tarefa"],
        enum: {
            values: ["rega", "fertilizacao", "colheita", "monitorizacao"],
            message: "Tipo inválido"
        }
    },
    state: {
        type: String,
        enum: {
            values: ["pendente", "concluido"],
            message: "Estado inválido"
        },
        default: "pendente"
    },
    scheduledFor: Date,
    doneAt: Date,
    doneBy: {
        type: mongoose.Types.ObjectId,
        ref: "user",
    }
}, { timestamps: true });

const taskModel = new mongoose.model("task", taskSchema);
export default taskModel; 