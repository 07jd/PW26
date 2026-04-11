export const clientePostSchema = 
{
  type: "object",
  required: [
    "username",
    "primeiroNome",
    "ultimoNome",
    "email",
    "palavra_passe",
    "telefone"
  ],
  properties: {
    username: {
      type: "string",
      minLength: 3
    },
    primeiroNome: {
      type: "string",
      minLength: 1
    },
    ultimoNome: {
      type: "string",
      minLength: 1
    },
    email: {
      type: "string"
    },
    palavra_passe: {
      type: "string",
      minLength: 6
    },
    telefone: {
      type: "string"
    }
  },
  additionalProperties: false
};