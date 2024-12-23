class CreateInstallmentDTO {
    constructor(data) {
        this.payment_id = data.payment_id;
        this.due_date = data.due_date;
        this.amount = data.amount;
        this.balance = data.balance;
        this.status = data.status || 'PENDING';
        this.installment_number = data.installment_number;
        this.total_installments = data.total_installments;
        this.account_entry_id = data.account_entry_id;
    }

    validate() {
        if (!this.payment_id) throw new Error('ID do pagamento é obrigatório');
        if (!this.due_date) throw new Error('Data de vencimento é obrigatória');
        if (!this.amount) throw new Error('Valor é obrigatório');
        if (!this.balance) throw new Error('Saldo é obrigatório');
        if (!this.installment_number) throw new Error('Número da parcela é obrigatório');
        if (!this.total_installments) throw new Error('Total de parcelas é obrigatório');
        if (!this.account_entry_id) throw new Error('ID do lançamento contábil é obrigatório');
        return true;
    }
}

module.exports = CreateInstallmentDTO;
