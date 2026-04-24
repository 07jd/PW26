import mongoose from "mongoose"

const notas_schema = new mongoose.Schema(
    {
        codigoDisciplina: 
        {
            type: Number,
            required: true,
            unique: true
        },
        nomeProfessor: 
        {
            type: String,
            required: true
        },
        nomeDisciplina: 
        {
            type: String,
            required: true
        },
        nota: 
        {
            type: Number,
            required: true,
            min: 0,
            max: 20
        }
    },
    {
        timestamps: true
    }
);

const nota = mongoose.model("nota", notas_schema); 

export default nota;