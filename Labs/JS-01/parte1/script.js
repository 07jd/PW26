// Var
var nome = "João";
console.log(nome);

nome = "Maria";
console.log(nome);


// Let
let idade = 20;
console.log(idade);

idade = 21;
console.log(idade);


// Const
const PI = 3.14;
console.log(PI);


// Tipos de dados

// String
let frase = "Olá, mundo!";
console.log(typeof frase);

// Number
let numero = 10;
console.log(typeof numero);

// Bool
let verdade = true;
console.log(typeof verdade);

// Array
let lista = ["banana", "maçã", "laranja"];
console.log(typeof lista);

// Object
let pessoa = { nome: "João", idade: 20 };
console.log(typeof pessoa);

// null
let nulo = null;
console.log(typeof nulo);

// undefined
let indefinido;
console.log(typeof indefinido);



// Exercicios
nome = "Rui";
let nova_Var = 99;

const constante = 1234;
//constante = 4321;

console.log("Array tipos INICIO");
let array_tipos = [null, "hello", 12, 12.2, undefined]
array_tipos.forEach
(
    (e) => console.log(typeof e)
)
console.log("Array tipos FIM");

console.log("Objeto disciplina:")
let disciplina = {
    nome: "disciplina",
    prof: "prof",
    alunos: [
        "joao",
        "rui",
        "ricardo",
    ],
    nota_min: 9.5,
}

for(let key in disciplina)
{
    console.log(`${key}:`, disciplina[key])
}