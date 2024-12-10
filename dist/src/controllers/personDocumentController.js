"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonDocumentController = void 0;
const personDocumentService_1 = require("../services/personDocumentService");
const errorHandler_1 = require("../utils/errorHandler");
class PersonDocumentController {
    personDocumentService;
    constructor() {
        this.personDocumentService = new personDocumentService_1.PersonDocumentService();
    }
    async createPersonDocument(req, res) {
        try {
            const personDocumentData = req.body;
            const personDocument = await this.personDocumentService.createPersonDocument(personDocumentData);
            res.status(201).json(personDocument);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async getPersonDocumentById(req, res) {
        try {
            const { id } = req.params;
            const personDocument = await this.personDocumentService.getPersonDocumentById(id);
            res.status(200).json(personDocument);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async listPersonDocuments(req, res) {
        try {
            const { page, limit, person, type } = req.query;
            const result = await this.personDocumentService.listPersonDocuments({
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
                person: person ? String(person) : undefined,
                type: type ? String(type) : undefined
            });
            res.status(200).json(result);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async updatePersonDocument(req, res) {
        try {
            const { id } = req.params;
            const personDocumentData = req.body;
            const updatedPersonDocument = await this.personDocumentService.updatePersonDocument(id, personDocumentData);
            res.status(200).json(updatedPersonDocument);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async deletePersonDocument(req, res) {
        try {
            const { id } = req.params;
            await this.personDocumentService.deletePersonDocument(id);
            res.status(204).send();
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
}
exports.PersonDocumentController = PersonDocumentController;
//# sourceMappingURL=personDocumentController.js.map