"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonAddressController = void 0;
const personAddressService_1 = require("../services/personAddressService");
const errorHandler_1 = require("../utils/errorHandler");
class PersonAddressController {
    personAddressService;
    constructor() {
        this.personAddressService = new personAddressService_1.PersonAddressService();
    }
    async createPersonAddress(req, res) {
        try {
            const personAddressData = req.body;
            const personAddress = await this.personAddressService.createPersonAddress(personAddressData);
            res.status(201).json(personAddress);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async getPersonAddressById(req, res) {
        try {
            const { id } = req.params;
            const personAddress = await this.personAddressService.getPersonAddressById(id);
            res.status(200).json(personAddress);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async listPersonAddresses(req, res) {
        try {
            const { page, limit, personId, city, state } = req.query;
            const result = await this.personAddressService.listPersonAddresses({
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
                personId: personId ? String(personId) : undefined,
                city: city ? String(city) : undefined,
                state: state ? String(state) : undefined
            });
            res.status(200).json(result);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async updatePersonAddress(req, res) {
        try {
            const { id } = req.params;
            const personAddressData = req.body;
            const updatedPersonAddress = await this.personAddressService.updatePersonAddress(id, personAddressData);
            res.status(200).json(updatedPersonAddress);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async deletePersonAddress(req, res) {
        try {
            const { id } = req.params;
            await this.personAddressService.deletePersonAddress(id);
            res.status(204).send();
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
}
exports.PersonAddressController = PersonAddressController;
//# sourceMappingURL=personAddressController.js.map