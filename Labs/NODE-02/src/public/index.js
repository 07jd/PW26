const output = document.getElementById("output");
const clienteBtn = document.getElementById("getCliente");
const clienteID = document.getElementById("clienteID");
const consumosBtn = document.getElementById("addConsumo");
const id = document.getElementById("id");
const mes = document.getElementById("mes");
const ano = document.getElementById("ano");
const custo = document.getElementById("custo");
const data = document.getElementById("data");
const kwh = document.getElementById("kwh");
const clienteAddBtn = document.getElementById("addCliente");
const nome = document.getElementById("nome");
const endereco = document.getElementById("endereco");
const numero = document.getElementById("numero");
const cidade = document.getElementById("cidade");
const cod_postal = document.getElementById("cod_postal");
const tarifa = document.getElementById("tarifa");
const fornecedor = document.getElementById("fornecedor");
const contrato_ativo = document.getElementById("contrato_ativo");
const cliente_add_id = document.getElementById("clientnewid");

clienteBtn.addEventListener("click", async () => {
    try
    {
        const id = clienteID.value;
        const response = await fetch(`/clientes/${id}`);
        if(!response.ok)
        {
            output.innerText = `[${response.status}] Cliente nao encontrado`;
            return
        }

        const data = await response.json();
        output.innerText = JSON.stringify(data, 0, 4);
    }
    catch(e)
    {
        output.innerText = `Erro ao fazer GET: ${e.message}`;
        console.log(e);
    }
});

consumosBtn.addEventListener("click", async () => {
    const values = [
        id.value,
        mes.value,
        ano.value,
        custo.value,
        data.value,
        kwh.value,
    ];

    for (const v of values) 
    {
        if(v === "" || v == undefined || v == null)
        {
            output.innerText = "Prencha todos os parametros afim de adicionar uma fatura nova.";
            return;
        }
    }


    try
    {
        const consumo = {
            mes: mes.value,
            ano: parseInt(ano.value),
            kWhConsumido: parseInt(kwh.value),
            custoTotal: parseFloat(custo.value),
            dataLeitura: data.value
        };

        const response = await fetch(`clientes/${values[0]}/adicionarConsumo`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(consumo)
        })

        if (!response.ok)
        {
            console.log("Falha no post!");
            output.innerText = `[${response.status}] Falha no post`;
        }
        else
        {
            output.innerText = "Sucesso, fatura adicionada";
        }
    }
    catch(e)
    {
        output.innerText = `Erro ao fazer POST: ${e.message}`;
        console.log(e);
    }
});

clienteAddBtn.addEventListener("click", async () => {
    const values = [
        nome.value,
        endereco.value,
        numero.value,
        cidade.value,
        cod_postal.value,
        cliente_add_id.value
    ];

    for(const v of values)
    {
        if(v === "" || v == undefined || v == null)
        {
            output.innerText = "Prencha todos os parametros obrigatorios afim de adicionar um novo cliente.";
            return;
        }
    }

    const cliente = {
        clienteId: String(values[5]),
        nome: values[0],
        endereco: {
            rua: values[1],
            numero: values[2],
            cidade: values[3],
            codigoPostal: values[4]
        },
        consumo: []
    }

    const optionals = [
        tarifa.value,
        fornecedor.value,
        contrato_ativo.value
    ]

    let info = optionals.filter(v => v !== "" && v != null);
    if(info.length == optionals.length)
    {
        let ativo = optionals[2] === "1" || optionals[2] === 1;
        cliente.informacoesAdicionais = {
            tipoTarifa: optionals[0],
            fornecedorEnergia: optionals[1],
            contratoAtivo: ativo
        }
    }
    else if(info.length != 0)
    {
        output.innerText = "Todos os parametros opcionais devem estar preenchidos se desejados.";
        return;
    }

    try
    {
        let res = await fetch("/clientes/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(cliente)
            }
        )

        if(!res.ok)
        {
            output.innerText = `[${res.status}] Erro ao adicionar cliente`;
        }
        else
        {
            output.innerText = "Cliente adicionado com sucesso";
        }
    }
    catch(e)
    {
        output.innerText = `Erro ao fazer POST: ${e.message}`;
        console.log(e);
    }
});