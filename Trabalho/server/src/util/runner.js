import loteModel from "../models/lote.js";
import alertModel from "../models/alerts.js";

// 30m
const TIME = 30 * (60*1000);    

async function canCreateAlert(description) {
  const exists = await alertModel.findOne({
    description,
    createdAt: {
      $gte: new Date(Date.now() - 30 * 60 * 1000)
    }
  });

  return !exists;
}

async function checkLotes()
{
    try
    {
        const lotes = await loteModel.find({
          state: { $ne: "concluido" }
        }).populate("plans").populate("tasks");

        for(const lote of lotes)
        {
            if(lote.plans.length === 0) continue;
            if(lote.state === "comprometido")
            {
                const msg = `[Comprometido] Lote ${lote.num} comprometido, verifique o seu estado.`;
                if(!(await canCreateAlert(msg))) continue;

                await alertModel.create({
                    level: "urgent",
                    description: msg,
                });

                continue;
            }

            const now = new Date();
            for(const plan of lote.plans)
            {
                const finishBy = new Date(lote.createdAt);
                finishBy.setDate(finishBy.getDate() + plan.duration);
                
                if(plan.type === "regular" && now > finishBy)
                {
                    const msg = `[Atrasado] Lote ${lote.num}, plano regular.`;
                    if(!(await canCreateAlert(msg))) continue;

                    await alertModel.create({
                        level: "info",
                        description: msg 
                    })
                }
                else if(plan.type === "pontual")
                {
                    const msg = `[Pontual] Lote ${lote.num}, tem um plano pontual afim de ser completado.`;
                    if(!(await canCreateAlert(msg))) continue;

                    await alertModel.create({
                        level: "urgent",
                        description: msg,
                    })
                }
                else
                {
                    const msg = `[Emergencia] Lote ${lote.num}, tem um plano de emergencia não completado.`;
                    if(!(await canCreateAlert(msg))) continue;

                    await alertModel.create({
                        level: "warning",
                        description: msg 
                    })
                }
            }

            for(const task of lote.tasks)
            {
                if(task.state === "concluido") continue;

                const todo_at = new Date(task.scheduledFor);
                if(now > todo_at)
                {
                    const msg = `[Tarefa: Lote ${lote.num}] Tarefa em atraso do tipo ${task.type}.`;
                    if(!(await canCreateAlert(msg))) continue;

                    await alertModel.create({
                        level: "warning",
                        description: msg 
                    })
                }
            }
        }
    }
    catch(e)
    {
        console.log(`[Err] Failed to run background job on Lotes [${e}]`);
    }
}

export async function runBackgroundJob()
{
    console.log("[Info] Executing background job");
    await checkLotes();
    console.log(`[Info] Background job done, next job at ${new Date(Date.now() + TIME)}`);


    setInterval(async () => {
        console.log("[Info] Executing background job");
        await checkLotes();
        console.log(`[Info] Background job done, next job at ${new Date(Date.now() + TIME)}`);
    }, TIME);
} 