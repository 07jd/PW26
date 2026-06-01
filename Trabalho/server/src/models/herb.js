import mongoose from "mongoose";

const herb_schena = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Forneça um nome"],
        trim: true,
        unique: [true, "Já existe uma erva com este nome"],
        minlength: [1, "O nome não deve estar vazio"],
        maxlength: [30, "O nome não deve exceder 30 caracteres"],
    },
    description: {
        type: String,
        trim: true,
        default: "Sem descrição"
    },
    category: {
        type: String,
        required: [true, "Forneça um categoria valida"],
        enum: {
            values: ["aromática", "culinaria", "medicinal", "outro"],
            message: "Categoria inválida"
        },
        default: "aromática"
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        _id: false,
        ref: "user",
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        _id: false,
        ref: "user",
    }
}, { timestamps: true, strict: true });


const herb_model = new mongoose.model("herb", herb_schena);
export default herb_model; 