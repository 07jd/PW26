import { Router } from "express"
import authMiddleware from "../middleware/authMiddlewares.js"
import loteModel from "../models/lote.js";
import taskModel from "../models/task.js"

const route_name = "/stats";
const router = Router();
export { route_name, router };

router.get("/", authMiddleware, async (_, res) => {
    try
    {
        const lotes = await loteModel.find().lean();
        const tasks = await taskModel.find().lean();

        const lotes_ativos = lotes.filter(l => l.state !== "concluido").length;

        const late_tasks = tasks.filter(
            t => Date.now() > new Date(t.scheduledFor).getTime()
        ).length;

        const finished_tasks = tasks.filter(
            t => t.state === "concluido"
        );

        let avg_time = 0;

        if (finished_tasks.length > 0) {
            for (const tk of finished_tasks) {
                const time =
                    (new Date(tk.doneAt) -
                        new Date(tk.createdAt)) /
                    (1000 * 60);

                avg_time += time;
            }

            avg_time /= finished_tasks.length;
        }

        const finished_lotes = lotes.filter(
            l => l.state === "concluido"
        );

        let avg_prod = 0;

        for (const lt of finished_lotes) {
            avg_prod += lt.productivity;
        }

        if (finished_lotes.length > 0) {
            avg_prod /= finished_lotes.length;
        }

        const graph = lotes.map(l => ({
            num: l.num,
            productivity: l.productivity,
        }));

        return res.status(200).json({
            avgTime: avg_time,
            avgProductivity: avg_prod,
            lateTasks: late_tasks,
            activeLotes: lotes_ativos,
            graph
        });
    }
    catch
    {
        return res.status(500).send();
    }
})