import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Nome obrigatório"],
        unique: [true, "Nome já em uso"],
        minlength: [5, "Nome deve ter no mínimo 5 caracteres"],
        maxlength: [80, "Nome deve ter no máximo 80 caracteres"],
    },
    herb: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "herb",
        required: [true, "ID da erva obrigatório"]
    },
    type: {
        type: String,
        required: [true, "Tipo de plano é necessário"],
        enum: {
            values: ["regular", "emergencia", "pontual"],
            message: ["Tipo de plano inválido"]
        }
    }
}, {
    discriminatorKey: "type"
});

const planModel = new mongoose.model("plan", planSchema);
export default planModel;

export const regularPlan = planModel.discriminator("regular", new mongoose.Schema({
    // Cº
    temperature: {
        min: {
            type: Number,
            required: [true, "Temperatura minima necessária"]
        },
        max: {
            type: Number,
            required: [true, "Temperatura máxima necessária"]
        }
    },
    // LUX
    luminosity: {
        min: {
            type: Number,
            required: [true, "Luminosidade minima necessária"],
            min: [0, "Lumonisidade deve ser >= 0"]
        },
        max: {
            type: Number,
            required: [true, "Luminosidade máxima necessária"],
            min: [0, "Lumonisidade deve ser >= 0"]
        }
    },
    // Relative %
    humidity: {
        min: {
            type: Number,
            required: [true, "Humidade minima necessária"],
            min: [0, "A quantidade minima deve ser >= 0"],
            max: [100, "A quantidade minima deve ser <= 100"],
        },
        max: {
            type: Number,
            required: [true, "Humidade máxima necessária"],
            min: [0, "A quantidade máxima deve ser >= 0"],
            max: [100, "A quantidade máxima deve ser <= 100"],
        }
    },
    // Times per day
    watering: {
        type: Number,
        required: [true, "Valor de rega obrigatório"],
        min: [0, "Rega deve ser >= 0"],
    },
    // Per week
    fertilization: {
        frequency: {
            type: Number,
            min: [0, "Fertilização deve ser >= 0"],
            default: 0,
        },
        quantity: {
            type: Number,
            min: [0, "Fertilização deve ser >= 0"],
            default: 0,
        }
    },
    // In days
    duration: {
        type: Number,
        required: [true, "Duração obrigatória"],
        min: [1, "Deve ter duração mínima de 1"]
    }
}));

export const emergencyPlan = planModel.discriminator("emergencia", new mongoose.Schema({
    // Doença, pragas, calor, ...
    reason: {
        type: String,
        required: [true, "Razão é necessária"],
        minlength: [1, "Razão não deve estar vazia"],
        trim: true,
    },
    // Em horas
    minInterval: {
        type: Number,
        required: [true, "Intervalo mínimo necessário"],
        min: [1, "O intervalo mínimo é de 1 hora"],
        validator: {
            validator: Number.isInteger,
            message: "Intervalo deve ser um número inteiro"
        }
    },
    // Unidades
    dosage: {
        type: Number,
        required: [true, "Dosagem necessária"],
        min: [0, "Dosagem deve ser >= 0"],
    },
    // Itensidade 0-10
    intensity: {
        type: Number,
        required: [true, "Itensidade necessária"],
        min: [0, "Itensidade deve ser >= 0"],
        max: [10, "Itensidade deve ser <= 10"]
    }
}));

export const pontualPlan = planModel.discriminator("pontual", new mongoose.Schema({
    action: {
        type: String,
        required: [true, "Ação a tomar é obrigatória"],
        trim: true,
        minlength: [1, "Ação nao deve estar vazia"]
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "Forneça quem lhe deu autorização"]
    },
    done: {
        type: Boolean,
        default: false
    },
    doneAt: {
        type: Date,
    }
}));