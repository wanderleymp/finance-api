import { Request, Response } from 'express';
import { PersonContactService } from '../services/personContactService';
import { handleErrorResponse } from '../utils/errorHandler';

export class PersonContactController {
  private personContactService: PersonContactService;

  constructor() {
    this.personContactService = new PersonContactService();
  }

  async createPersonContact(req: Request, res: Response): Promise<void> {
    try {
      const personContactData = req.body;
      const personContact = await this.personContactService.createPersonContact(personContactData);
      res.status(201).json(personContact);
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }

  async getPersonContactById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const personContact = await this.personContactService.getPersonContactById(id);
      res.status(200).json(personContact);
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }

  async findPersonContacts(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, person, contactId } = req.query;
      const result = await this.personContactService.findPersonContacts({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        person: person ? String(person) : undefined,
        contactId: contactId ? String(contactId) : undefined
      });
      res.status(200).json(result);
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }

  async updatePersonContact(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const personContactData = req.body;
      const updatedPersonContact = await this.personContactService.updatePersonContact(id, personContactData);
      res.status(200).json(updatedPersonContact);
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }

  async deletePersonContact(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.personContactService.deletePersonContact(id);
      res.status(204).send();
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }
}
