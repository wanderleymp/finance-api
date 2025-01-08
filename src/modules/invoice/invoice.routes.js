const express = require('express');
const { body, param } = require('express-validator');
const InvoiceController = require('./invoice.controller');

const router = express.Router();

// Validation middleware for invoice creation
const createInvoiceValidation = [
  body('reference_id').notEmpty().withMessage('Reference ID is required'),
  body('type').notEmpty().withMessage('Type is required'),
  body('emitente_person_id').optional().isInt().withMessage('Emitente Person ID must be an integer'),
  body('destinatario_person_id').optional().isInt().withMessage('Destinatario Person ID must be an integer'),
  body('total_amount').optional().isFloat().withMessage('Total amount must be a number')
];

// Validation middleware for invoice update
const updateInvoiceValidation = [
  param('id').isInt().withMessage('Invoice ID must be an integer'),
  body('type').optional(),
  body('status').optional(),
  body('total_amount').optional().isFloat().withMessage('Total amount must be a number')
];

// Invoice Routes
router.post('/', createInvoiceValidation, InvoiceController.create);
router.get('/', InvoiceController.findAll);
router.get('/:id', 
  param('id').isInt().withMessage('Invoice ID must be an integer'), 
  InvoiceController.findById
);
router.put('/:id', updateInvoiceValidation, InvoiceController.update);
router.delete('/:id', 
  param('id').isInt().withMessage('Invoice ID must be an integer'), 
  InvoiceController.delete
);

module.exports = router;
