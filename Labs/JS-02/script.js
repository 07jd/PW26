if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./serviceWorker.js")
            .then(() => console.log("Service Worker registado"))
            .catch(err => console.log("Erro Service Worker: ", err));
    });
}

// Fase 1
function guardarLocal()
{
    let nome = document.getElementById("nome").value;

    localStorage.setItem("nomeLocal", nome);
    console.log("Guardado no localStorage");
}

function guardarSession()
{
    let nome = document.getElementById("nome").value;

    sessionStorage.setItem("nomeSession", nome);
    console.log("Guardado no sessionStorage");
}

function lerDados()
{
    let local = localStorage.getItem("nomeLocal");
    let session = sessionStorage.getItem("nomeSession");

    console.log("LocalStorage: ", local);
    console.log("SessionStorage: ", session);   
}

// Fase 2..5
let db;
let request = indexedDB.open("EscolaDB", 1);

const alunos_table = document.getElementById("alunos_table_db");
const alunos_table_body = alunos_table.querySelector("tbody");

const input_numero_aluno = document.getElementById("numero_aluno");
const input_nome_aluno = document.getElementById("nome_aluno");
const input_curso_aluno = document.getElementById("curso_aluno");

request.onupgradeneeded = (event) => 
{
    db = event.target.result;
    db.createObjectStore("alunos", { keyPath: "id" });
}

request.onsuccess = (event) =>
{
    db = event.target.result;
    console.log("Base de Dados criada");

    carregarAlunos();
}

function clearAlunoInsertInput()
{
    input_numero_aluno.value = "";
    input_nome_aluno.value = "";
    input_curso_aluno.value = "";
}

function guardarAluno(aluno)
{
    let transaction = db.transaction(["alunos"], "readwrite");
    let store = transaction.objectStore("alunos");

    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td>${aluno.id}</td>
        <td>${aluno.nome}</td>
        <td>${aluno.curso}</td>
    `;

    alunos_table_body.appendChild(tr);


    store.add(aluno);
    console.log("Aluno adicionado na IndexedDB");
}

function carregarAlunos()
{
    let transaction = db.transaction(["alunos"], "readonly");
    let store = transaction.objectStore("alunos");
    let request = store.openCursor();

    request.onsuccess = (event) =>
    {
        let cursor = event.target.result;

        if (cursor)
        {
            let aluno = cursor.value;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${aluno.id}</td>
                <td>${aluno.nome}</td>
                <td>${aluno.curso}</td>
            `; 

            alunos_table_body.appendChild(tr);
            cursor.continue();
        }
    }
}

function inserirAlunoDB()
{
    let numero_aluno = input_numero_aluno.value;
    let nome_aluno = input_nome_aluno.value;
    let curso_aluno = input_curso_aluno.value;

    if (nome_aluno.trim() == "" || curso_aluno.trim() == "" || numero_aluno.trim() == "")
    {
        alert("Dados de Alunos inválidos");
        return;
    }

    const aluno = 
    {
        id: numero_aluno,
        nome: nome_aluno,
        curso: curso_aluno
    };


    guardarAluno(aluno);
    clearAlunoInsertInput();
}

alunos_table_body.addEventListener("click", (e) => {
    const aluno_clickado = e.target.parentElement;

    input_numero_aluno.value = aluno_clickado.children[0].textContent; 
    input_nome_aluno.value   = aluno_clickado.children[1].textContent; 
    input_curso_aluno.value  = aluno_clickado.children[2].textContent; 
});