import { Request, Response } from 'express';
import { PersonDocumentService } from '../services/personDocumentService';
import { handleErrorResponse } from '../utils/errorHandler';

export class PersonDocumentController {
  private personDocumentService: PersonDocumentService;

  constructor() {
    this.personDocumentService = new PersonDocumentService();
  }

  async createPersonDocument(req: Request, res: Response): Promise<void> {
    try {
      const personDocumentData = req.body;
      const personDocument = await this.personDocumentService.createPersonDocument(personDocumentData);
      res.status(201).json(personDocument);
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }

  async getPersonDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const personDocument = await this.personDocumentService.getPersonDocumentById(id);
      res.status(200).json(personDocument);
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }

  async listPersonDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, person, type } = req.query;
      const result = await this.personDocumentService.listPersonDocuments({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        person: person ? String(person) : undefined,
        type: type ? String(type) : undefined
      });
      res.status(200).json(result);
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }

  async updatePersonDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const personDocumentData = req.body;
      const updatedPersonDocument = await this.personDocumentService.updatePersonDocument(id, personDocumentData);
      res.status(200).json(updatedPersonDocument);
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }

  async deletePersonDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.personDocumentService.deletePersonDocument(id);
      res.status(204).send();
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }
}
