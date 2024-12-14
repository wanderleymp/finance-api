const express = require('express');
const addressController = require('../controllers/addressController');
const { validateRequest } = require('../middlewares/requestValidator');
const addressSchema = require('../schemas/addressSchema');

const router = express.Router();

router.get('/cep/:cep', validateRequest(addressSchema.findByCep, 'params'), addressController.findByCep);

module.exports = router;
