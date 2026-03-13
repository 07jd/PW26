let clicks_botao = 0, clicks_enter = 0, elementos = 0;

const botao = document.getElementById("botao");
const botaoCliques = document.getElementById("button-count");
const enterCliques = document.getElementById("enter-count");

const liAdd = document.getElementById("lista-add");
const liRem = document.getElementById("lista-rem");
const liConteudo = document.getElementById("lista-conteudo");
const textBox = document.getElementById("input-text");

//Ao carregar página mudar texto de h1, e atualizar o texto sobre os counters
window.onload = () =>
{
  const h1 = document.querySelector("h1");
  h1.textContent = "Olá, mundo!";

  botaoCliques.textContent = clicks_botao;
  enterCliques.textContent = clicks_enter;
};

//Detectar quando o botão é clicado, alterar o h1 e atualizar o counter
botao.addEventListener("click", function () {
  const h1 = document.querySelector("h1");
  h1.textContent = "Botão foi clicado!";
  h1.style.backgroundColor = "red";

  clicks_botao++;
  botaoCliques.textContent = clicks_botao;
}
);

//Detectar o 'enter', atualizar counter e informar através da consola
document.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    console.log("A tecla ENTER foi pressionada!");

    //Alterar count
    clicks_enter++;
    enterCliques.textContent = clicks_enter;

    let content = textBox.value;
    console.log("Texto da textBox -> " + content);
  }
}
);

//Adicionar elementos 'li' quando clicado no "botão"
liAdd.addEventListener("click", function () {
  console.log("Add elemento");
  elementos++;

  const novoElemento = document.createElement("li");
  novoElemento.textContent = ("Elemento " + elementos);

  liConteudo.appendChild(novoElemento);
});

//Remover elementos 'li' quando clicado no "botão"
liRem.addEventListener("click", function () {
  if (elementos == 0) {
    console.log("Não há elementos na lista!");
  } else {
    console.log("Rem elemento");
    elementos--;
    liConteudo.removeChild(liConteudo.lastElementChild);
  }
});

//Remover elementos tipo 'li' quando clicados
liConteudo.addEventListener("click", function (e) {
  if (e.target.tagName === "LI") {
    console.log("Rem elemento (via click)");

    elementos--;
    e.target.remove();
  }
});