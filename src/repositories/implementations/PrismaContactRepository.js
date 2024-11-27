const IContactRepository = require('../IContactRepository');
const { PrismaClient } = require('@prisma/client');
const { formatContactValue, detectContactType } = require('../../utils/contactFormatter');

/**
 * Implementação do repositório de contatos usando Prisma
 * 
 * Nota importante sobre o banco de dados:
 * - Operações de UPDATE na tabela contacts podem ser afetadas por triggers
 * - Se houver necessidade de triggers, garantir que as referências NEW e OLD 
 *   correspondam às colunas existentes na tabela
 */
class PrismaContactRepository extends IContactRepository {
  constructor() {
    super();
    this.prisma = new PrismaClient();
  }

  /**
   * Gets the contact type based on the type ID or auto-detects from value
   * @param {string} contactValue 
   * @param {number} [contactTypeId] 
   * @returns {Promise<number>}
   */
  async getContactTypeId(contactValue, contactTypeId = null) {
    // Se o tipo foi especificado, verifica se existe
    if (contactTypeId) {
      const contactType = await this.prisma.contact_types.findUnique({
        where: { contact_type_id: contactTypeId }
      });
      
      if (contactType) {
        return contactTypeId;
      }
    }

    // Auto-detecta o tipo baseado no valor
    const { type } = detectContactType(contactValue);
    
    const contactType = await this.prisma.contact_types.findFirst({
      where: {
        description: type
      }
    });

    if (!contactType) {
      throw new Error(`Contact type not found for value: ${contactValue}`);
    }

    return contactType.contact_type_id;
  }

  /**
   * Finds or creates a contact based on the contact value
   * @param {Object} params
   * @param {string} params.contactValue - The contact value
   * @param {number} [params.contactTypeId] - Optional contact type ID
   * @param {string} [params.contactName] - Optional contact name
   * @returns {Promise<{contact_id: number, contact_type_id: number, contact_value: string, contact_name: string}>}
   */
  async findOrCreateContact({ contactValue, contactTypeId, contactName }) {
    try {
      // Primeiro obtém o tipo de contato (especificado ou auto-detectado)
      const finalTypeId = await this.getContactTypeId(contactValue, contactTypeId);
      
      // Obtém o tipo para formatação
      const contactType = await this.prisma.contact_types.findUnique({
        where: { contact_type_id: finalTypeId }
      });

      // Formata o valor do contato baseado no tipo
      const formattedValue = formatContactValue(contactValue, contactType.description);

      // Procura contato existente (ignorando maiúsculas/minúsculas)
      const existingContact = await this.prisma.contacts.findFirst({
        where: {
          contact_value: {
            equals: formattedValue,
            mode: 'insensitive'
          }
        }
      });

      if (existingContact) {
        // Se encontrou, verifica se precisa atualizar
        const updateData = {};
        
        if (contactName && existingContact.contact_name !== contactName) {
          updateData.contact_name = contactName;
        }
        
        if (contactTypeId && existingContact.contact_type_id !== finalTypeId) {
          updateData.contact_type_id = finalTypeId;
        }

        // Só atualiza se houver mudanças
        if (Object.keys(updateData).length > 0) {
          return await this.prisma.contacts.update({
            where: { contact_id: existingContact.contact_id },
            data: updateData
          });
        }

        return existingContact;
      }

      // Se não encontrou, cria novo contato
      return await this.prisma.contacts.create({
        data: {
          contact_type_id: finalTypeId,
          contact_value: formattedValue,
          contact_name: contactName
        }
      });
    } catch (error) {
      console.error('Error in findOrCreateContact:', error);
      throw error;
    }
  }

  /**
   * Associates a contact with a person
   * @param {number} personId 
   * @param {number} contactId 
   */
  async associateContactWithPerson(personId, contactId) {
    // Check if association already exists
    const existingAssociation = await this.prisma.person_contacts.findFirst({
      where: {
        person_id: personId,
        contact_id: contactId
      }
    });

    if (existingAssociation) {
      return existingAssociation;
    }

    // Create new association
    return await this.prisma.person_contacts.create({
      data: {
        person_id: personId,
        contact_id: contactId
      }
    });
  }
}

module.exports = PrismaContactRepository;
