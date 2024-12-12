const request = require('supertest');
const express = require('express');
const roadmapRoutes = require('../routes/roadmapRoutes');

const app = express();
app.use(express.json());
app.use('/roadmap', roadmapRoutes);

describe('Roadmap Routes', () => {
  test('GET /roadmap deve retornar todas as tarefas', async () => {
    const response = await request(app).get('/roadmap');
    
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');
    expect(Array.isArray(response.body.tasks)).toBe(true);
    expect(response.body.tasks.length).toBeGreaterThan(0);
  });

  test('GET /roadmap?status=pendente deve retornar tarefas pendentes', async () => {
    const response = await request(app).get('/roadmap?status=pendente');
    
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');
    expect(Array.isArray(response.body.tasks)).toBe(true);
    
    // Verificar se todas as tarefas retornadas têm status pendente
    response.body.tasks.forEach(task => {
      expect(task.status).toBe('pendente');
    });
  });

  test('GET /roadmap?status=concluído deve retornar tarefas concluídas', async () => {
    const response = await request(app).get('/roadmap?status=concluído');
    
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('success');
    expect(Array.isArray(response.body.tasks)).toBe(true);
    
    // Verificar se todas as tarefas retornadas têm status concluído
    response.body.tasks.forEach(task => {
      expect(task.status).toBe('concluído');
    });
  });
});
