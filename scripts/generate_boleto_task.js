const AsyncTaskService = require('../src/services/asyncTaskService');
const BoletoIntegrationService = require('../src/services/boletoIntegrationService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const movementId = 637;
  const scheduledTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hora no futuro

  try {
    console.log(`Iniciando agendamento de tarefas para movimento ${movementId}`);

    // Agenda tarefas em sequência
    const tasks = await AsyncTaskService.scheduleTaskChain([
      {
        movementId: movementId,
        scheduledFor: scheduledTime
      },
      {
        movementId: movementId + 1, // Próximo movimento
        scheduledFor: new Date(scheduledTime.getTime() + 30 * 60 * 1000) // 30 min depois
      }
    ]);

    console.log('Tarefas agendadas com sucesso:', tasks.map(t => t.task_id));

    // Verifica se a primeira tarefa pode ser executada
    const canExecute = await AsyncTaskService.canExecuteTask(tasks[0]);
    if (!canExecute) {
      console.log(`Tarefa ${tasks[0].task_id} não pode ser executada devido a dependências pendentes`);
      return;
    }

    // Simula processamento do boleto
    console.log(`Gerando boleto para movimento ${movementId}`);
    const boleto = await BoletoIntegrationService.generateBoleto(movementId);
    console.log('Boleto gerado com sucesso:', boleto);

    // Atualiza status da tarefa
    const updatedTask = await prisma.tasks.update({
      where: { task_id: tasks[0].task_id },
      data: { 
        status_id: 3, // Assumindo que 3 é o status de COMPLETED
        completed_at: new Date()
      }
    });

    // Registra log da tarefa
    await AsyncTaskService.logTaskExecution(
      tasks[0].task_id, 
      `Boleto gerado com sucesso para movimento ${movementId}`, 
      3 // Status de sucesso
    );

    console.log('Tarefa concluída com sucesso:', updatedTask);

  } catch (error) {
    console.error('Erro crítico no processamento de boleto:', error);

    // Registra log de erro
    if (tasks && tasks.length > 0) {
      await AsyncTaskService.logTaskExecution(
        tasks[0].task_id, 
        `Erro na geração de boleto: ${error.message}`, 
        4 // Assumindo que 4 é o status de FAILED
      );

      // Atualiza status da tarefa para falha
      await prisma.tasks.update({
        where: { task_id: tasks[0].task_id },
        data: { 
          status_id: 4, // Status de falha
          completed_at: new Date()
        }
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
