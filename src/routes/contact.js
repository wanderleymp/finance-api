const express = require('express');
const ContactController = require('../controllers/contactController');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

/**
 * @swagger
 * /contacts/person/{personId}:
 *   post:
 *     tags: [Contacts]
 *     summary: Add a contact to a person
 *     parameters:
 *       - in: path
 *         name: personId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The person ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactValue
 *             properties:
 *               contactValue:
 *                 type: string
 *                 description: The contact value (email, phone, or whatsapp)
 *     responses:
 *       201:
 *         description: Contact added successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/person/:personId', ContactController.addContactToPerson);

module.exports = router;
