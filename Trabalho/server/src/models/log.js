import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    system: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        trim: true
    }
}, {timestamps: true});

const logModel = new mongoose.model("log", logSchema);
export default logModel;