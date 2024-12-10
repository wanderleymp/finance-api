"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactController = void 0;
const contactService_1 = require("../services/contactService");
const errorHandler_1 = require("../utils/errorHandler");
class ContactController {
    contactService;
    constructor() {
        this.contactService = new contactService_1.ContactService();
    }
    async createContact(req, res) {
        try {
            const contactData = req.body;
            const contact = await this.contactService.createContact(contactData);
            res.status(201).json(contact);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async getContactById(req, res) {
        try {
            const { id } = req.params;
            const contact = await this.contactService.getContactById(id);
            res.status(200).json(contact);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async listContacts(req, res) {
        try {
            const { page, limit, type } = req.query;
            const result = await this.contactService.listContacts({
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
                type: type ? String(type) : undefined
            });
            res.status(200).json(result);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async updateContact(req, res) {
        try {
            const { id } = req.params;
            const contactData = req.body;
            const updatedContact = await this.contactService.updateContact(id, contactData);
            res.status(200).json(updatedContact);
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
    async deleteContact(req, res) {
        try {
            const { id } = req.params;
            await this.contactService.deleteContact(id);
            res.status(204).send();
        }
        catch (error) {
            (0, errorHandler_1.handleErrorResponse)(res, error);
        }
    }
}
exports.ContactController = ContactController;
//# sourceMappingURL=contactController.js.map