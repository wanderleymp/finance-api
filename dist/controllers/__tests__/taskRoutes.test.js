"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const rabbitmq_1 = require("../../config/rabbitmq");
describe('Testes de Rotas de Tarefas', () => {
    beforeAll(async () => {
        await (0, rabbitmq_1.connectRabbitMQ)();
    });
    afterAll(async () => {
        await (0, rabbitmq_1.closeRabbitMQ)();
    });
    it('Deve agendar uma tarefa com sucesso', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
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
        const response = await (0, supertest_1.default)(app_1.default)
            .post('/api/tasks')
            .send({
            payload: { message: 'Sem nome da tarefa' }
        });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Nome da tarefa é obrigatório');
    });
    // Novos casos de teste
    it('Deve retornar erro para taskName inválido', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .post('/api/tasks')
            .send({
            taskName: '',
            payload: { message: 'Testando taskName inválido' }
        });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'taskName deve ser uma string não vazia');
    });
    it('Deve retornar erro para payload inválido', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .post('/api/tasks')
            .send({
            taskName: 'TestTask',
            payload: 'String inválida'
        });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Payload deve ser um objeto válido');
    });
});
