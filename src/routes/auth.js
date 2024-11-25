const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const logger = require('../../config/logger');
const PrismaUserRepository = require('../repositories/implementations/PrismaUserRepository');

const userRepository = new PrismaUserRepository();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autenticar usuário
 *     description: Autentica um usuário usando username/email e senha, retornando um token JWT e dados completos do usuário
 *     tags: [Auth]
 *     servers:
 *       - url: https://api.agilefinance.com.br
 *         description: Servidor de produção
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Username ou email do usuário
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *             example:
 *               identifier: "admin@example.com"
 *               password: "123456"
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticação
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     profile:
 *                       type: object
 *                     person:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         full_name:
 *                           type: string
 *                         fantasy_name:
 *                           type: string
 *                         birth_date:
 *                           type: string
 *                         contacts:
 *                           type: object
 *                           properties:
 *                             byType:
 *                               type: object
 *                             list:
 *                               type: array
 *                         documents:
 *                           type: array
 *                         licenses:
 *                           type: array
 *                         address:
 *                           type: object
 *                         tax_regime:
 *                           type: object
 *                         type:
 *                           type: string
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/login', async (req, res) => {
    const startTime = Date.now();
    const { identifier, password } = req.body;

    try {
        console.log('=== INÍCIO DO LOGIN ===');
        console.log('Dados recebidos:', { identifier, temSenha: !!password });
        
        // Busca o usuário por username ou qualquer valor de contato
        const user = await userRepository.findByIdentifier(identifier);
        
        if (!user) {
            console.log('Usuário não encontrado');
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        console.log('Resultado da busca:', { 
            encontrado: true,
            id: user.user_id,
            username: user.username,
            temSenha: !!user.password,
            hashDaSenha: user.password?.substring(0, 10) + '...'
        });

        // Verifica se tem senha
        if (!user.password) {
            console.log('Usuário não tem senha definida');
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        console.log('Verificando senha com Argon2...');
        
        // Verifica a senha usando Argon2
        const validPassword = await argon2.verify(user.password, password);
        
        console.log('Resultado da verificação:', { senhaCorreta: validPassword });
        
        if (!validPassword) {
            console.log('Senha incorreta');
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Formata os contatos do usuário
        const contacts = {};
        const contactsList = [];
        if (user.persons?.person_contacts) {
            console.log('Processando contatos:', user.persons.person_contacts);
            user.persons.person_contacts.forEach(pc => {
                if (pc.contacts) {
                    const contact = {
                        id: pc.contacts.contact_id,
                        type: pc.contacts.contact_types?.type_name,
                        type_id: pc.contacts.contact_type_id,
                        value: pc.contacts.contact_value,
                        name: pc.contacts.contact_name
                    };
                    contactsList.push(contact);
                    
                    // Agrupa por tipo também
                    if (contact.type) {
                        const type = contact.type.toLowerCase();
                        if (!contacts[type]) contacts[type] = [];
                        contacts[type].push(contact);
                    }
                }
            });
        }

        // Formata as licenças do usuário
        const licenses = user.persons?.person_license?.map(pl => ({
            id: pl.licenses.license_id,
            name: pl.licenses.name,
            status: pl.licenses.status,
            expiration_date: pl.licenses.expiration_date
        })) || [];

        // Formata os documentos do usuário
        const documents = user.persons?.person_documents?.map(pd => ({
            id: pd.document_id,
            type: pd.document_types.type_name,
            value: pd.document_value
        })) || [];

        // Gera o token JWT
        const token = jwt.sign(
            { 
                id: user.user_id, 
                username: user.username,
                role: user.role,
                profile_id: user.profile_id
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );
        
        console.log('Login bem-sucedido:', { 
            userId: user.user_id, 
            username: user.username,
            contatos: contacts
        });

        res.json({ 
            token,
            user: {
                id: user.user_id,
                username: user.username,
                profile: user.profiles,
                person: {
                    id: user.persons?.person_id,
                    full_name: user.persons?.full_name,
                    fantasy_name: user.persons?.fantasy_name,
                    birth_date: user.persons?.birth_date,
                    contacts: {
                        byType: contacts,
                        list: contactsList
                    },
                    documents,
                    licenses,
                    address: user.persons?.addresses,
                    tax_regime: user.persons?.person_tax_regimes?.[0],
                    type: user.persons?.person_types?.description
                }
            }
        });
    } catch (error) {
        console.error('Erro durante autenticação:', {
            mensagem: error.message,
            tipo: error.name,
            stack: error.stack?.split('\n'),
            dados: {
                id: user?.user_id,
                username: user?.username,
                temContatos: !!user?.persons?.person_contacts,
                numContatos: user?.persons?.person_contacts?.length
            }
        });
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
