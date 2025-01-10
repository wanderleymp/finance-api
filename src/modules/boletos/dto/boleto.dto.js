/**
 * @class BoletoCreateDTO
 * @description DTO para criação de boleto
 */
class BoletoCreateDTO {
    constructor(data) {
        this.installment_id = data.installment_id;
        this.due_date = data.due_date;
        this.amount = data.amount;
        this.payer_id = data.payer_id;
        this.description = data.description;
    }

    validate() {
        if (!this.installment_id) throw new Error('ID da parcela é obrigatório');
        if (!this.due_date) throw new Error('Data de vencimento é obrigatória');
        if (!this.amount || this.amount <= 0) throw new Error('Valor deve ser maior que zero');
        if (!this.payer_id) throw new Error('ID do pagador é obrigatório');
    }
}

/**
 * @class BoletoResponseDTO
 * @description DTO para resposta de boleto
 */
class BoletoResponseDTO {
    constructor(data) {
        this.boleto_id = data.boleto_id;
        this.installment_id = data.installment_id;
        this.due_date = data.due_date;
        this.amount = data.amount;
        this.status = data.status;
        this.boleto_url = data.boleto_url;
        this.codigo_barras = data.codigo_barras;
        this.linha_digitavel = data.linha_digitavel;
        this.pix_copia_e_cola = data.pix_copia_e_cola;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }
}

/**
 * @class BoletoUpdateDTO
 * @description DTO para atualização de boleto
 */
class BoletoUpdateDTO {
    constructor(data) {
        this.due_date = data.due_date;
        this.amount = data.amount;
        this.status = data.status;
    }

    validate() {
        if (this.amount && this.amount <= 0) throw new Error('Valor deve ser maior que zero');
    }
}

module.exports = {
    BoletoCreateDTO,
    BoletoResponseDTO,
    BoletoUpdateDTO
};
