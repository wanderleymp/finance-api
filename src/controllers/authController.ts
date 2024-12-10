import { Request, Response } from 'express';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { ENV } from '../config/env.js';

export const register = async (req: Request, res: Response) => {
  try {
    const { user_name, password } = req.body;

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({ 
      where: { user_name } 
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }

    // Hashear senha
    const hashedPassword = await argon2.hash(password);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        user_name,
        password: hashedPassword
      }
    });

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, user_name: user.user_name }, 
      ENV.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.status(201).json({ token });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { user_name, password } = req.body;

    // Buscar usuário
    const user = await prisma.user.findUnique({ 
      where: { user_name } 
    });

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, user_name: user.user_name }, 
      ENV.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
