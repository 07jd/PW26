import mongoose from "mongoose";

const loteSchema = new mongoose.Schema({
    num: {
        type: Number,
        required: [true, "Número do lote"],
        min: 0,
        unique: [true, "Número de lote já em uso"],
        validate: {
            validator: Number.isInteger,
            message: "Número do lote inválido"
        }
    },
    state: {
        type: String,
        required: [true, "Estado obrigatório"],
        enum: {
            values: ["ativo", "comprometido", "concluido"],
            message: "Estado inválido"
        }
    },
    herb: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "herb",
        required: [true, "Forneça a erva associada a este lote"]
    },
    plans: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "plan" 
        }
    ],
    quantityPlanted: {
        type: Number,
        min: [0, "Quantidade plantada dever ser >=0"],
        required: [true, "Forneça a quantidade plantada"]
    },
    quantityHarvested: {
        type: Number,
        min: [0, "Quantidade plantada dever ser >=0"],
        default: 0
    },
    quantityLoss: {
        type: Number,
        min: [0, "Quantidade de perca deve ser >=0"],
        default: 0,
    },
    reasonLoss : {
        type: String,
        trim: true,
    },
    // %
    productivity: {
        type: Number,
        default: 0,
    },
    // Default -> Auto
    operationMode: {
        type: String,
        enum: {
            values: ["auto", "manual"],
            message: "Modo de operação inválido"
        },
        default: "auto"
    },
    observations: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
    start: {
        type: Date,
        required: [true, "Data de ínicio obrigatória"],
        default: Date.now
    },
    end: {
        type: Date
    }
}, { timestamps: true })

// Calculate productivity on save
loteSchema.pre("save", async function () {
    if(this.quantityPlanted > 0)
    {
        this.productivity = this.quantityHarvested / (this.quantityPlanted - this.quantityLoss);
    }
})

const loteModel = new mongoose.model("lote", loteSchema);
export default loteModel;