import express from 'express';

const app = express();

// Middleware para parsear JSON
app.use(express.json());

export default app;
