"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonController = void 0;
const personService_1 = require("../services/personService");
const errorHandler_1 = require("../utils/errorHandler");
class PersonController {
    personService;
    constructor() {
        this.personService = new personService_1.PersonService();
    }
    async createPerson(req, res) {
        try {
            const personData = req.body;
            const person = await this.personService.createPerson(personData);
            res.status(201).json(person);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async getPersonById(req, res) {
        try {
            const { id } = req.params;
            const person = await this.personService.getPersonById(id);
            res.status(200).json(person);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async listPersons(req, res) {
        try {
            const { page, limit, name } = req.query;
            const result = await this.personService.listPersons({
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
                name: name ? String(name) : undefined
            });
            res.status(200).json(result);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async updatePerson(req, res) {
        try {
            const { id } = req.params;
            const personData = req.body;
            const updatedPerson = await this.personService.updatePerson(id, personData);
            res.status(200).json(updatedPerson);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async deletePerson(req, res) {
        try {
            const { id } = req.params;
            await this.personService.deletePerson(id);
            res.status(204).send();
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
}
exports.PersonController = PersonController;
//# sourceMappingURL=personController.js.map