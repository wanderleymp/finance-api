import { publishTask, consumeTasks } from '../queues/taskQueue';
export async function scheduleTask(taskName: string, payload: any) {
    try {
        await publishTask(taskName, payload);
        console.log(`📋 Tarefa "${taskName}" agendada com sucesso`);
        return true;
    }
    catch (error) {
        console.error("Erro ao agendar tarefa:", error);
        throw error;
    }
}
export async function startTaskConsumer() {
    await consumeTasks(async (task) => {
        console.log(`🎯 Processando tarefa: ${task.taskName}`, task.payload);
        // Lógica de processamento da tarefa
        switch (task.taskName) {
            case "example_task":
                // Exemplo de processamento
                console.log("Processando tarefa de exemplo");
                break;
            default:
                console.warn(`Tarefa desconhecida: ${task.taskName}`);
        }
    });
}
export async function processTask(taskName: string, payload: any) {
    // Função para processamento manual de tarefas, se necessário
    console.log(`Processando tarefa ${taskName} manualmente`);
    // Adicione lógica de processamento específica aqui
}
export async function processTaskMessage(content: any): Promise<boolean> {
    try {
        console.log(`🎯 Processando tarefa: ${content.taskName}`, content);
        // Lógica de processamento da tarefa
        switch (content.taskName) {
            case "example_task":
                // Exemplo de processamento
                console.log("Processando tarefa de exemplo");
                return true;
            default:
                console.warn(`Tarefa desconhecida: ${content.taskName}`);
                return false;
        }
    }
    catch (error) {
        console.error("Erro ao processar tarefa:", error);
        return false;
    }
}
