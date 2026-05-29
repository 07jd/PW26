import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username obrigatório"],
    unique: [true, "Username já em uso"],
    trim: true,
    minlength: [3, "Username deve ser de tamanho mínimo 3"],
    maxlength: [20, "Username deve ser de tamanho máximo 20"],
    // yoinked from https://stackoverflow.com/questions/1221985/how-to-validate-a-user-name-with-regex
    // Deve conter apenas caracteres ASCII, (letras e digitos)
    // Não pode conter espaços
    // Pode usar _ e - como separadores internos
    //      ex válido:    user-name & user_name
    //      ex inválido:  user--name & user__name
    validate: [/^[A-Za-z0-9]+(?:[_-][A-Za-z0-9]+)*$/, "Username inválido"],
  },
  email: {
    type: String,
    required: [true, "Email obrigatório"],
    unique: [true, "Email em uso"],
    // yoinked from https://colinhacks.com/essays/reasonable-email-regex
    validate: [
      /^(?!\.)(?!.*\.\.)([a-z0-9_'+\-\.]*)[a-z0-9_+\-]@([a-z0-9][a-z0-9\-]*\.)+[a-z]{2,}$/i,
      "Email inválido",
    ],
  },
  password: {
    type: String,
    required: [true, "Password obrigatória"],
    trim: true,
    minlength: [8, "Password deve ter tamanho mínimo de 8 caracteres"],
    maxlength: [64, "Password deve ter tamanho máximo de 64 caracteres"],
  },
  role: {
    type: String,
    enum: {
      values: ["Técnico", "Responsável", "Administrador"],
      message: "Role inválido",
    },
    default: "Técnico",
  },
  refreshTokens: [String],
}, { timestamps: true, strict: true });

// Hash password before saving
userSchema.pre("save", async function () {
  try {
    if (!this.isModified("password")) return;

    // Default is 10 rounds
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
  } catch (e) {
    next(e);
  }
});

userSchema.methods.changePassword = async function (password)
{
  try
  {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(password, salt);
  }
  catch(e)
  {
    throw new Error("Não foi possível mudar a palavra passe");
  }
}

userSchema.methods.isPasswordCorrect = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (e) {
    throw new Error("Não foi possivel verificar");
  }
};

const user = mongoose.model("user", userSchema);
export default user;
