import { Request, Response } from 'express';
import { ContactService } from '../services/contactService';
import { handleErrorResponse } from '../utils/errorHandler';

export class ContactController {
  private contactService: ContactService;

  constructor() {
    this.contactService = new ContactService();
  }

  async createContact(req: Request, res: Response): Promise<void> {
    try {
      const contactData = req.body;
      const contact = await this.contactService.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }

  async getContactById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const contact = await this.contactService.getContactById(id);
      res.status(200).json(contact);
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }

  async listContacts(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, type } = req.query;
      const result = await this.contactService.listContacts({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        type: type ? String(type) : undefined
      });
      res.status(200).json(result);
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }

  async updateContact(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const contactData = req.body;
      const updatedContact = await this.contactService.updateContact(id, contactData);
      res.status(200).json(updatedContact);
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }

  async deleteContact(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.contactService.deleteContact(id);
      res.status(204).send();
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }
}
