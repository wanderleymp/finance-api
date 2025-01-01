class BoletoDTO {
    constructor(data) {
        this.boleto_id = data.boleto_id;
        this.status = data.status;
        this.generated_at = data.generated_at;
        this.boleto_number = data.boleto_number;
        this.boleto_url = data.boleto_url;
    }
}

class InstallmentResponseDTO {
    constructor(data) {
        this.installment_id = data.installment_id;
        this.payment_id = data.payment_id;
        this.account_entry_id = data.account_entry_id;
        this.installment_number = data.installment_number;
        this.due_date = data.due_date;
        this.expected_date = data.expected_date;
        this.amount = data.amount;
        this.balance = data.balance;
        this.status = data.status;

        // Calcula dias em atraso ou adiantamento
        const currentDate = new Date('2025-01-01T10:40:07Z');
        const expectedDate = new Date(this.expected_date);
        
        const timeDiff = currentDate.getTime() - expectedDate.getTime();
        this.days_overdue = Math.floor(timeDiff / (1000 * 3600 * 24));

        // Inclui boletos se existirem
        if (data.boletos) {
            this.boletos = data.boletos.map(boleto => new BoletoDTO(boleto));
        }
    }
}

module.exports = InstallmentResponseDTO;
