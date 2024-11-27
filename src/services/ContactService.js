class ContactService {
  constructor(contactRepository) {
    this.contactRepository = contactRepository;
  }

  /**
   * Processes a contact value and associates it with a person
   * @param {Object} params
   * @param {string} params.contactValue - The contact value (email, phone, or whatsapp)
   * @param {number} params.personId - The person ID to associate the contact with
   * @param {number} [params.contactTypeId] - Optional contact type ID
   * @param {string} [params.contactName] - Optional contact name
   * @returns {Promise<{contact_id: number, contact_type_id: number, contact_value: string, contact_name: string, person_contact_id: number}>}
   */
  async processAndAssociateContact({ contactValue, personId, contactTypeId, contactName }) {
    try {
      // First, find or create the contact
      const contact = await this.contactRepository.findOrCreateContact({
        contactValue,
        contactTypeId,
        contactName
      });

      if (!contact) {
        throw new Error('Failed to create or find contact');
      }

      // Then associate it with the person
      const personContact = await this.contactRepository.associateContactWithPerson(personId, contact.contact_id);
      if (!personContact) {
        throw new Error('Failed to associate contact with person');
      }

      return {
        ...contact,
        person_contact_id: personContact.person_contact_id
      };
    } catch (error) {
      console.error('Error in processAndAssociateContact:', error);
      throw new Error(`Error processing contact: ${error.message}`);
    }
  }
}

module.exports = ContactService;
