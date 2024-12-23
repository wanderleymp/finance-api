class UpdateInstallmentDTO {
    constructor(data) {
        this.status = data.status;
        this.payment_date = data.payment_date;
        this.updated_at = new Date();
    }

    validate() {
        if (!this.status) throw new Error('Status é obrigatório');
        return true;
    }
}

module.exports = UpdateInstallmentDTO;
