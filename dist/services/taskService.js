"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleTask = scheduleTask;
exports.startTaskConsumer = startTaskConsumer;
exports.processTask = processTask;
const taskQueue_1 = require("../queues/taskQueue");
async function scheduleTask(taskName, payload) {
    try {
        await (0, taskQueue_1.publishTask)(taskName, payload);
        console.log(`📋 Tarefa "${taskName}" agendada com sucesso`);
        return true;
    }
    catch (error) {
        console.error('Erro ao agendar tarefa:', error);
        throw error;
    }
}
async function startTaskConsumer() {
    await (0, taskQueue_1.consumeTasks)(async (task) => {
        console.log(`🎯 Processando tarefa: ${task.taskName}`, task.payload);
        // Lógica de processamento da tarefa
        switch (task.taskName) {
            case 'example_task':
                // Exemplo de processamento
                console.log('Processando tarefa de exemplo');
                break;
            default:
                console.warn(`Tarefa desconhecida: ${task.taskName}`);
        }
    });
}
async function processTask(taskName, payload) {
    // Função para processamento manual de tarefas, se necessário
    console.log(`Processando tarefa ${taskName} manualmente`);
    // Adicione lógica de processamento específica aqui
}
