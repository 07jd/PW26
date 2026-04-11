export const produtoSchema = 
{
  type: "object",
  required: ["id", "name", "price"],
  properties: {
    id: {
      type: "integer",
      minimum: 0
    },
    name: {
      type: "string",
      minLength: 1
    },
    price: {
      type: "number",
      minimum: 0
    }
  },
  additionalProperties: false
};