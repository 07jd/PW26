import mongoose from "mongoose";

const metricSchema = new mongoose.Schema({
    lote: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "lote",
        required: [true, "Forneça o lote associado à medição"]
    },
    temperature: {
        type: Number,
        required: [true, "Valor de temperatura necessário"],
    },
    luminosity: {
        type: Number,
        required: [true, "Luminosidade necessária"],
        min: [0, "Luminosidade deve ser >= 0"]
    },
    humidity: {
        type: Number,
        required: [true, "Humidade necessária"],
        min: [0, "Humidade deve ser >=0"],
        max: [100, "Humidade deve ser <=100"]
    },
    time: {
        type: Date,
        default: Date.now,
        unique: [true, "Já existe um registro associado a esse momento"]
    }
}, { timestamps: true });

const metricModel = new mongoose.model("metric", metricSchema);
export default metricModel;