"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonContactController = void 0;
const personContactService_1 = require("../services/personContactService");
const errorHandler_1 = require("../utils/errorHandler");
class PersonContactController {
    personContactService;
    constructor() {
        this.personContactService = new personContactService_1.PersonContactService();
    }
    async createPersonContact(req, res) {
        try {
            const personContactData = req.body;
            const personContact = await this.personContactService.createPersonContact(personContactData);
            res.status(201).json(personContact);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async getPersonContactById(req, res) {
        try {
            const { id } = req.params;
            const personContact = await this.personContactService.getPersonContactById(id);
            res.status(200).json(personContact);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async listPersonContacts(req, res) {
        try {
            const { page, limit, personId, contactId } = req.query;
            const result = await this.personContactService.listPersonContacts({
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
                personId: personId ? String(personId) : undefined,
                contactId: contactId ? String(contactId) : undefined
            });
            res.status(200).json(result);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async updatePersonContact(req, res) {
        try {
            const { id } = req.params;
            const personContactData = req.body;
            const updatedPersonContact = await this.personContactService.updatePersonContact(id, personContactData);
            res.status(200).json(updatedPersonContact);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async deletePersonContact(req, res) {
        try {
            const { id } = req.params;
            await this.personContactService.deletePersonContact(id);
            res.status(204).send();
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
}
exports.PersonContactController = PersonContactController;
//# sourceMappingURL=personContactController.js.map