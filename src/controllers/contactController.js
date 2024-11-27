const PrismaContactRepository = require('../repositories/implementations/PrismaContactRepository');
const ContactService = require('../services/ContactService');

const contactRepository = new PrismaContactRepository();
const contactService = new ContactService(contactRepository);

class ContactController {
  /**
   * Add a contact to a person
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async addContactToPerson(req, res) {
    try {
      const personId = parseInt(req.params.personId);
      const { contactValue, contactTypeId, contactName } = req.body;

      // Se contactTypeId for uma string vazia, converte para null
      const finalContactTypeId = contactTypeId === "" ? null : parseInt(contactTypeId);

      if (!personId || !contactValue) {
        return res.status(400).json({
          error: 'Missing required parameters',
          requiredParams: ['personId', 'contactValue'],
          optionalParams: ['contactTypeId', 'contactName']
        });
      }

      const result = await contactService.processAndAssociateContact({
        contactValue,
        personId,
        contactTypeId: finalContactTypeId,
        contactName
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in addContactToPerson:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ContactController;
