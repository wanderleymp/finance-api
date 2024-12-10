import { Request, Response } from 'express';
import { PersonAddressService } from '../services/personAddressService';
import { handleErrorResponse } from '../utils/errorHandler';

export class PersonAddressController {
  private personAddressService: PersonAddressService;

  constructor() {
    this.personAddressService = new PersonAddressService();
  }

  async createPersonAddress(req: Request, res: Response): Promise<void> {
    try {
      const personAddressData = req.body;
      const personAddress = await this.personAddressService.createPersonAddress(personAddressData);
      res.status(201).json(personAddress);
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }

  async getPersonAddressById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const personAddress = await this.personAddressService.getPersonAddressById(id);
      res.status(200).json(personAddress);
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }

  async listPersonAddresses(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, person, city, state } = req.query;
      const result = await this.personAddressService.listPersonAddresses({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        person: person ? String(person) : undefined,
        city: city ? String(city) : undefined,
        state: state ? String(state) : undefined
      });
      res.status(200).json(result);
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }

  async updatePersonAddress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const personAddressData = req.body;
      const updatedPersonAddress = await this.personAddressService.updatePersonAddress(id, personAddressData);
      res.status(200).json(updatedPersonAddress);
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }

  async deletePersonAddress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.personAddressService.deletePersonAddress(id);
      res.status(204).send();
    } catch (error) {
      handleErrorResponse(res, error);
    }
  }
}
