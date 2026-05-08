// Possible types:
//  name_and_type [plan_name, herb, plan_type]
//  type_params [specific params needed by previous plan_type]
let form_state;
let current_plan_type;
let are_inputs_added;
let form_changed;
let continue_form;

const username = document.getElementById("username");
const end_session = document.getElementById("end_session");
end_session.addEventListener("click", () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = "/login";
})

username.addEventListener("click", () => {
    window.location.href = "/account";
});

async function openDB()
{
    const request = indexedDB.open("PlansDB", 1);

    request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("plans")) {
            db.createObjectStore("plans", {
                keyPath: "id",
                autoIncrement: true
            });
        }
    };

    return await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Feedback text, display if plan was added or got an error
const feedback_text = document.getElementById("feedback_text"); 
const form_inputs = document.getElementById("form_inputs");
const continue_button = document.getElementById("form_submit_button");
const form_buttons_div = document.getElementById("form_buttons");
const feedback_text_reset_ms = 10 * 1000;

function wipeFormDiv()
{
    form_inputs.innerHTML = "";
    feedback_text.textContent = "";
}

function createInputDiv(inputID, label, placeholder)
{
    const div_label = document.createElement("p");
    div_label.textContent = label;
    const div_input = document.createElement("input");
    div_input.placeholder = placeholder;
    div_input.id = inputID;

    // Just in case
    if (typeof(placeholder) == Number)
        div_input.type = Number;
    else if (typeof(placeholder) == String)
        div_input.type = String;
    
    const new_div = document.createElement("div");
    new_div.className = "input_div";
    new_div.appendChild(div_label);
    new_div.appendChild(div_input);
    
    form_inputs.appendChild(new_div);
}

function createSelectionDiv(inputID, label, choices)
{
    const div_label = document.createElement("p");
    div_label.textContent = label;
    const div_select = document.createElement("select");
    div_select.id = inputID;
    for(value of choices)
    {
        const new_option = document.createElement("option");
        new_option.text = value;
        div_select.appendChild(new_option);
    }
    
    const new_div = document.createElement("div");
    new_div.className = "input_div";
    new_div.appendChild(div_label);
    new_div.appendChild(div_select);
    
    form_inputs.appendChild(new_div);
}

// Variables
let plan_name = "";
let herb_name = "";
let plan_type = "";
const plan_types = ["Regular", "Emergência", "Pontual"];

let i_plan_name = undefined;
let i_herb_name = undefined;
let i_plan_type = undefined; 

// Regular plan
let i_watering = undefined;
let i_fertilization = undefined;
let i_duration = undefined;
// min, max
let i_temp = [0,0];
let i_humidity = [0,0];
let i_luminosity = [0,0];
// Emergency
let i_issue = undefined;
let i_interventation = undefined;
let i_min_interval = undefined;
let i_dosage = undefined;
let i_priority = undefined;
// Pontual
let i_action = undefined;
let i_date = undefined;
let i_lote = undefined;
let i_authorized = undefined;

// "name_and_type"
// Returns bool if it can continue
function getValuesElements()
{
    if (form_state === "name_and_type")
    {
        i_plan_name = document.getElementById("i_plan_name").value.trim();
        i_herb_name = document.getElementById("i_herb_name").value.trim();
        i_plan_type = document.getElementById("i_plan_type").value.trim();

        return !(i_plan_name === "" || i_herb_name === "" || i_plan_type === "");
    }
    else if (form_state === "type_params")
    {
        switch(i_plan_type)
        {
            case "Regular":
            {
                let i_temp_min =       Number(document.getElementById("i_temp_min").value.trim());
                let i_temp_max =       Number(document.getElementById("i_temp_max").value.trim());
                let i_humidity_min =   Number(document.getElementById("i_humidity_min").value.trim());
                let i_humidity_max =   Number(document.getElementById("i_humidity_max").value.trim());
                let i_luminosity_min = parseInt(document.getElementById("i_luminosity_min").value.trim(), 10);
                let i_luminosity_max = parseInt(document.getElementById("i_luminosity_max").value.trim(), 10);
                i_watering =           parseInt(document.getElementById("i_watering").value.trim(), 10);
                i_fertilization =      parseInt(document.getElementById("i_fertilization").value.trim(), 10);
                i_duration =           parseInt(document.getElementById("i_duration").value.trim(), 10);

                const nums = [
                    i_temp_min, i_temp_max,
                    i_humidity_min, i_humidity_max,
                    i_luminosity_min, i_luminosity_max,
                    i_watering, i_fertilization, i_duration
                ];

                if (nums.some(v => isNaN(v))) return false;
                if (
                    i_humidity_min >= 0 && i_humidity_max <= 100 && i_humidity_min + 1 <= i_humidity_max &&
                    i_luminosity_min >= 0 && i_luminosity_min + 1 <= i_luminosity_max &&
                    i_watering >= 0 && i_fertilization >= 0 && i_duration >= 1
                )
                {
                    i_temp[0] = i_temp_min;
                    i_humidity[0] = i_humidity_min;
                    i_luminosity[0] = i_luminosity_min;

                    i_temp[1] = i_temp_max;
                    i_humidity[1] = i_humidity_max;
                    i_luminosity[1] = i_luminosity_max;

                    return true;
                }

                return false;
            }
            case "Pontual":
            {
                i_action = document.getElementById("i_action").value.trim();
                i_date = document.getElementById("i_date").value.trim();
                i_authorized = document.getElementById("i_authorized").value.trim();
                i_lote = parseInt(document.getElementById("i_lote").value.trim(), 10);

                const [day, month, year] = i_date.split("-");
                let i_date_obj = new Date(year, month-1, day);

                if (
                    isNaN(i_lote) ||
                    isNaN(i_date_obj.getTime()) ||
                    i_action === "" ||
                    (i_authorized !== "S" && i_authorized !== "N")
                ) {
                    return false;
                }

                if (i_lote < 0) return false;
                i_date = i_date_obj;
                return true;
            }
            case "Emergência":
            {
                i_issue =          document.getElementById("i_issue").value.trim();
                i_interventation = document.getElementById("i_interventation").value.trim();
                i_min_interval =   parseInt(document.getElementById("i_min_interval").value.trim(), 10);
                i_dosage =         parseInt(document.getElementById("i_dosage").value.trim(), 10);
                i_priority =       parseInt(document.getElementById("i_priority").value.trim(), 10);

                if (
                    i_issue === "" ||
                    i_interventation === "" ||
                    isNaN(i_min_interval) ||
                    isNaN(i_dosage) ||
                    isNaN(i_priority)
                ) {
                    return false;
                }

                if (i_priority >= 1 && i_priority <= 10 && i_dosage >= 1 && i_min_interval >= 1) return true;

                return false;
            }
            default:
                return false;
        }
    }

    return false;
}

// Set values from variables, used when pressed go_back button
function setValuesElement()
{
    if (form_state === "name_and_type")
    {
        document.getElementById("i_plan_name").value = i_plan_name;
        document.getElementById("i_herb_name").value = i_herb_name;
        document.getElementById("i_plan_type").value = i_plan_type;
    }
    else if (form_state === "type_params")
    {
        switch(i_plan_type)
        {
            case "Regular":
            {
                document.getElementById("i_temp_min").value = i_temp[0];
                document.getElementById("i_temp_max").value = i_temp[1];
                document.getElementById("i_humidity_min").value = i_humidity[0];
                document.getElementById("i_humidity_max").value = i_humidity[1];
                document.getElementById("i_luminosity_min").value = i_luminosity[0];
                document.getElementById("i_luminosity_max").value = i_luminosity[1];
                document.getElementById("i_watering").value = i_watering;
                document.getElementById("i_fertilization").value = i_fertilization;
                document.getElementById("i_duration").value = i_duration;
                break;
            }
            case "Pontual":
            {
                document.getElementById("i_action").value = i_action;
                document.getElementById("i_date").value = i_date;
                document.getElementById("i_authorized").value = i_authorized;
                document.getElementById("i_lote").value = i_lote;
                break;
            }
            case "Emergência":
            {
                document.getElementById("i_issue").value           = i_issue;              
                document.getElementById("i_interventation").value  = i_interventation;
                document.getElementById("i_min_interval").value    = i_min_interval;
                document.getElementById("i_dosage").value          = i_dosage;
                document.getElementById("i_priority").value        = i_priority;
                break;
            }
            default:
                break;
        }
    }
}

// Update form
function updateForm()
{
    // Inputs already present
    if(are_inputs_added && !form_changed) return;

    // Wipe divs if screen changed
    if(form_changed)
    {
        wipeFormDiv();
        form_changed = false;
        are_inputs_added = false;
    };

    if (form_state === "name_and_type")
    {
        continue_button.textContent = "Continuar";
        createInputDiv("i_plan_name", "Nome do Plano", "Plano da Pimenta Verão");
        createInputDiv("i_herb_name", "Erva Aromática", "Pimenta");
        createSelectionDiv("i_plan_type", "Tipo de Plano", plan_types);
        are_inputs_added = true;
    }
    else if (form_state === "type_params")
    {
        continue_button.textContent = "Criar Plano";
        switch(i_plan_type)
        {
            case "Regular": 
                createInputDiv("i_temp_min", "Temperatura Mínima", 15);
                createInputDiv("i_temp_max", "Temperatura Máxima", 32);
                createInputDiv("i_humidity_min", "Humidade Mínima", 32);
                createInputDiv("i_humidity_max", "Humidade Máxima", 32);
                createInputDiv("i_luminosity_min", "Lumonisidade Mínima", 600);
                createInputDiv("i_luminosity_max", "Lumonisidade Máxima", 1500);
                createInputDiv("i_watering", "Regação (p/semana)", 12);
                createInputDiv("i_fertilization", "Fertilização (p/semana)", 2);
                createInputDiv("i_duration", "Duração do plano (dias)", 7);
                are_inputs_added = true;
                break;
            case "Emergência":
                createInputDiv("i_issue", "Problema", "Infecção");
                createInputDiv("i_interventation", "Intervenção", "Aplicar Anti-fungíco");
                createInputDiv("i_min_interval", "Intervalo entre intervenções (horas)", 42);
                createInputDiv("i_dosage", "Dosagem (Unidades)", 1);
                createInputDiv("i_priority", "Prioridade (1-10)", 6);
                are_inputs_added = true;
                break;
            case "Pontual":
                createInputDiv("i_action", "Ação", "Monitorar");
                createInputDiv("i_date", "Data", "12-06-2026");
                createInputDiv("i_lote", "Lote", 42);
                createInputDiv("i_authorized", "Autorizado (S/N)", "S");
                are_inputs_added = true;
                break;
            default:
                console("panic");
                are_inputs_added = true;
                break;
        }

        // Add go_back button
        const btn = form_buttons_div.querySelector("goBackButton");
        if(btn == null || btn == undefined)
        {
            const go_back_button = document.createElement("button");
            go_back_button.textContent = "Voltar";
            go_back_button.onclick = goBack;
            go_back_button.id = "goBackButton"
            form_buttons_div.prepend(go_back_button);
        }
    }
}

// Invoked on go_back button
function goBack()
{
    if (form_state === "type_params")
    {
        form_changed = true;
        form_state = "name_and_type";
        document.getElementById("goBackButton").remove();
        updateForm();
        setValuesElement();
    }
}

// Called every time press on continue/create button
async function validateAndContinue()
{
    if (form_state === "name_and_type")
    {
        continue_button.value = "Continuar";
        feedback_text.text = "";
        if (getValuesElements())
        {
            form_state = "type_params";
            form_changed = true;
        }
        else
        {
            feedback_text.textContent = "Input inválido";
            setTimeout(() => {
                feedback_text.textContent = "";
            }, feedback_text_reset_ms);
        }
    }
    else if(form_state === "type_params")
    {
        if(getValuesElements())
        {
            form_state = "name_and_type";
            form_changed = true;
            await sendData();
            feedback_text.textContent = "";
            document.getElementById("goBackButton").remove();
            wipeDataVariables();
            loadPlansTable();
        }
        else
        {
            feedback_text.textContent = "Input inválido";
            setTimeout(() => {
                feedback_text.textContent = "";
            }, feedback_text_reset_ms);
        }
    }

    updateForm();
}

async function sendData()
{
    let data = {
        nome: i_plan_name,
        erva: i_herb_name,
        tipo: i_plan_type,
        data: {}
    };

    switch(i_plan_type)
    {
        case "Regular":
            data.data = {
                temperatura: {
                    min: i_temp[0],
                    max: i_temp[1]
                },
                humidade: {
                    min: i_humidity[0],
                    max: i_humidity[1]
                },
                luminosidade: {
                    min: i_luminosity[0],
                    max: i_luminosity[1]
                },
                rega: i_watering,
                fertilizacao: i_fertilization,
                duracao: i_duration
            };
            break;

        case "Pontual":
            data.data = {
                acao: i_action,
                data_execucao: i_date,
                lote: i_lote,
                autorizado: i_authorized
            };
            break;

        case "Emergência":
            data.data = {
                problema: i_issue,
                intervencao: i_interventation,
                intervalo_minimo: i_min_interval,
                dosagem: i_dosage,
                prioridade: i_priority
            };
            break;

        default:
            data.data = {};
            break;
    }

    const db = await openDB();
    const tx = db.transaction("plans", "readwrite");
    const store = tx.objectStore("plans");
    store.add(data);
    console.log("Entry added");
}

function wipeDataVariables()
{
    plan_name = "";
    herb_name = "";
    plan_type = "";
    i_plan_name = undefined;
    i_herb_name = undefined;
    i_plan_type = undefined;
    temperature = [0,0];
    humidity = [0,0];
    luminosity = [0,0];
    duration_days = 0;
    i_temp = undefined;
    i_humidity = undefined;
    i_luminosity = undefined;
    i_watering = undefined;
    i_fertilization = undefined;
    i_duration = undefined;
    i_issue = undefined;
    i_interventation = undefined;
    i_min_interval = undefined;
    i_dosage = undefined;
    i_priority = undefined;
    i_action = undefined;
    i_date = undefined;
    i_lote = undefined;
    i_authorized = undefined;
}

let cachedPlans = [];
async function loadPlansTable()
{
    const db = await openDB();
    const tx = db.transaction("plans", "readonly");
    const store = tx.objectStore("plans");

    const request = store.getAll();

    request.onsuccess = () => {
        renderPlansTable(request.result);
    };

    request.onerror = () => {
        console.error("Erro ao carregar planos");
    };
}

function renderPlansTable(plans)
{
    cachedPlans = plans;

    const tbody = document.getElementById("plans_table_body");
    tbody.innerHTML = "";

    for (const plan of plans)
    {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${plan.id ?? "-"}</td>
            <td>${plan.nome ?? "-"}</td>
            <td>${plan.erva ?? "-"}</td>
            <td>${plan.tipo ?? "-"}</td>
            <td>
                <button onclick="showPlanDetails(${plan.id})">
                    Ver
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    }
}

function addDetail(container, label, value)
{
    const div = document.createElement("div");
    div.className = "detail_item";
    div.innerHTML = `<strong>${label}:</strong> ${value ?? "-"}`;
    container.appendChild(div);
}

function showPlanDetails(id)
{
    const plan = cachedPlans.find(p => p.id === id);
    if (!plan) return;

    const box = document.getElementById("plan_details");
    const body = document.getElementById("plan_details_body");

    body.innerHTML = "";

    addDetail(body, "ID", plan.id);
    addDetail(body, "Nome", plan.nome);
    addDetail(body, "Erva", plan.erva);
    addDetail(body, "Tipo", plan.tipo);

    const data = plan.data || {};

    for (const key in data)
    {
        const value = data[key];

        if (typeof value === "object")
        {
            addDetail(body, key, JSON.stringify(value));
        }
        else
        {
            addDetail(body, key, value);
        }
    }

    document.getElementById("plan_details").classList.remove("hidden");
    document.getElementById("table_view").classList.add("hidden");
}

function backToTable()
{
    document.getElementById("plan_details").classList.add("hidden");
    document.getElementById("table_view").classList.remove("hidden");
}

// On initial load
window.addEventListener("load", () => {
    form_state = "name_and_type";
    current_plan_type = undefined;
    are_inputs_added = false;
    form_changed = true;
    continue_form = false;
    updateForm();
    loadPlansTable();
})