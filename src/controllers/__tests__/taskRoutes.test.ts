import request from 'supertest';
import app from '../../app';
import { connectRabbitMQ, closeRabbitMQ } from '../../config/rabbitmq';

describe('Testes de Rotas de Tarefas', () => {
  beforeAll(async () => {
    await connectRabbitMQ();
  });

  afterAll(async () => {
    await closeRabbitMQ();
  });

  it('Deve agendar uma tarefa com sucesso', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({
        taskName: 'TesteTask',
        payload: { message: 'Testando agendamento de tarefa' }
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Tarefa agendada com sucesso!');
    expect(response.body).toHaveProperty('taskName', 'TesteTask');
  });

  it('Deve retornar erro ao não enviar nome da tarefa', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({
        payload: { message: 'Sem nome da tarefa' }
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Nome da tarefa é obrigatório');
  });

  // Novos casos de teste
  it('Deve retornar erro para taskName inválido', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({
        taskName: '',
        payload: { message: 'Testando taskName inválido' }
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'taskName deve ser uma string não vazia');
  });

  it('Deve retornar erro para payload inválido', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({
        taskName: 'TestTask',
        payload: 'String inválida'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Payload deve ser um objeto válido');
  });
});
