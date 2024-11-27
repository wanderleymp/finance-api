class IContactRepository {
  /**
   * Finds or creates a contact based on the contact value
   * @param {string} contactValue - The contact value (email, phone, or whatsapp)
   * @returns {Promise<{contact_id: number, contact_type_id: number, contact_value: string}>}
   */
  async findOrCreateContact(contactValue) {
    throw new Error('Method not implemented');
  }

  /**
   * Associates a contact with a person
   * @param {number} personId - The person ID
   * @param {number} contactId - The contact ID
   * @returns {Promise<void>}
   */
  async associateContactWithPerson(personId, contactId) {
    throw new Error('Method not implemented');
  }

  /**
   * Gets the contact type based on the contact value format
   * @param {string} contactValue - The contact value to analyze
   * @returns {Promise<number>} The contact type ID
   */
  async getContactTypeFromValue(contactValue) {
    throw new Error('Method not implemented');
  }
}

module.exports = IContactRepository;
