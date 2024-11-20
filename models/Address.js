const db = require('../config/database');

class Address {
  /**
   * Cria um novo endereço.
   * @param {Object} addressData - Dados do endereço.
   * @returns {Promise<Object>} - Endereço criado.
   */
  static async createAddress(addressData) {
    const query = `
      INSERT INTO public.addresses (
        person_id, street, number, complement, neighborhood,
        city, state, postal_code, country, reference, ibge
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11
      )
      RETURNING *;
    `;
    const values = [
      addressData.person_id, addressData.street, addressData.number,
      addressData.complement, addressData.neighborhood, addressData.city,
      addressData.state, addressData.postal_code, addressData.country,
      addressData.reference, addressData.ibge,
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Obtém um endereço pelo ID.
   * @param {number} addressId - ID do endereço.
   * @returns {Promise<Object>} - Endereço encontrado.
   */
  static async getAddressById(addressId) {
    const query = `
      SELECT *
      FROM public.addresses
      WHERE address_id = $1;
    `;
    const result = await db.query(query, [addressId]);
    return result.rows[0];
  }

  /**
   * Atualiza um endereço pelo ID.
   * @param {number} addressId - ID do endereço.
   * @param {Object} addressData - Dados atualizados do endereço.
   * @returns {Promise<Object>} - Endereço atualizado.
   */
  static async updateAddress(addressId, addressData) {
    const query = `
      UPDATE public.addresses
      SET
        street = $1,
        number = $2,
        complement = $3,
        neighborhood = $4,
        city = $5,
        state = $6,
        postal_code = $7,
        country = $8,
        reference = $9,
        ibge = $10
      WHERE address_id = $11
      RETURNING *;
    `;
    const values = [
      addressData.street, addressData.number, addressData.complement,
      addressData.neighborhood, addressData.city, addressData.state,
      addressData.postal_code, addressData.country, addressData.reference,
      addressData.ibge, addressId,
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Remove um endereço pelo ID.
   * @param {number} addressId - ID do endereço.
   * @returns {Promise<void>} - Sem retorno em caso de sucesso.
   */
  static async deleteAddress(addressId) {
    const query = `
      DELETE FROM public.addresses
      WHERE address_id = $1;
    `;
    await db.query(query, [addressId]);
  }

  static async getAddress(userId) {
    const query = `
      SELECT * FROM public.addresses;
    `;

    try {
      console.log(`Buscando enderecos para o usuário com ID: ${userId}`);
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (err) {
      console.error('Erro ao buscar enderecos:', err);
      throw err;
    }
  }




}



module.exports = Address;
