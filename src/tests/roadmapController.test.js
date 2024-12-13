const { startTask, finishTask, getTaskByTitle } = require('../controllers/roadmapController');
const { devDatabase } = require('../config/database');

describe('Roadmap Controller', () => {
  const testTaskTitle = 'Teste de Integração de Tarefa';

  beforeAll(async () => {
    // Garantir que a tarefa de teste exista
    await devDatabase.query(
      `INSERT INTO roadmap (title, description, status) 
       VALUES ($1, 'Tarefa para teste de integração', 'pendente')
       ON CONFLICT (title) DO NOTHING`,
      [testTaskTitle]
    );
  });

  test('startTask deve marcar tarefa como em progresso', async () => {
    const task = await startTask(testTaskTitle);
    
    expect(task).toBeTruthy();
    expect(task.status).toBe('em progresso');
    expect(task.started_at).toBeTruthy();
  });

  test('finishTask deve marcar tarefa como concluída', async () => {
    const task = await finishTask(testTaskTitle);
    
    expect(task).toBeTruthy();
    expect(task.status).toBe('concluído');
    expect(task.finished_at).toBeTruthy();
  });

  test('getTaskByTitle deve retornar detalhes da tarefa', async () => {
    const task = await getTaskByTitle(testTaskTitle);
    
    expect(task).toBeTruthy();
    expect(task.title).toBe(testTaskTitle);
    expect(task.status).toBe('concluído');
  });

  test('startTask deve lançar erro para tarefa inexistente', async () => {
    await expect(startTask('Tarefa Inexistente'))
      .rejects
      .toThrow();
  });
});
