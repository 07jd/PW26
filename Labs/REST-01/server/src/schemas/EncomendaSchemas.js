import {produtoSchema} from "./ProdutoSchemas.js";

export const encomendaPostSchema = 
{
  type: "object",
  required: ["clienteID", "content"],
  properties: 
  {
    clienteID: {
      type: "string",
      minLength: 1
    },
    content: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["qnt", "item"],
        properties: {
          qnt: {
            type: "integer",
            minimum: 1
          },

          item: produtoSchema
        },
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
};

export const encomendaPatchSchema = 
{
  type: "object",
  required: ["content"],
  properties: {
    content: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["qnt", "item"],
        properties: {
          qnt: {
            type: "integer",
            minimum: 1
          },
          item: {
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
          }
        },
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
};