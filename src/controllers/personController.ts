import { Request, Response } from 'express';
import { PersonService } from '../services/personService';
import { ApiError } from '../utils/apiErrors';

export class PersonController {
  private personService: PersonService;

  constructor() {
    this.personService = new PersonService();
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const personData = req.body;
      const person = await this.personService.createPerson(personData);
      return res.status(201).json(person);
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error('Erro ao criar pessoa:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async findById(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);
      const person = await this.personService.getPersonById(id);
      return res.json(person);
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error('Erro ao buscar pessoa:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const pageSize = parseInt(req.query.pageSize as string || '10', 10);

      const result = await this.personService.listPersons({ page, pageSize });
      return res.json(result);
    } catch (error) {
      console.error('Erro ao listar pessoas:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);
      const personData = req.body;
      const updatedPerson = await this.personService.updatePerson(id, personData);
      return res.json(updatedPerson);
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error('Erro ao atualizar pessoa:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);
      const deleted = await this.personService.deletePerson(id);
      return res.status(deleted ? 204 : 404).send();
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error('Erro ao deletar pessoa:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  async saveByCnpj(req: Request, res: Response): Promise<Response> {
    try {
      // Extrair CNPJ da URL e remover caracteres não numéricos
      const cnpj = req.params.cnpj.replace(/[^\d]/g, '');

      // Chamar serviço para salvar ou atualizar pessoa
      const person = await this.personService.saveOrUpdateByCnpj(cnpj);

      return res.status(200).json(person);
    } catch (error) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      console.error('Erro ao salvar pessoa por CNPJ:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
}
