const moment = require('moment-timezone');

class UpdateInstallmentDTO {
    constructor(data) {
        // Converte amount para decimal
        this.amount = this.convertMonetaryValue(data.amount);
        
        // Converte e valida data de vencimento
        if (data.due_date) {
            const parsedDueDate = moment.tz(data.due_date, 'America/Sao_Paulo');
            
            if (!parsedDueDate.isValid()) {
                throw new Error('Data de vencimento inválida');
            }
            
            // Define horário para 15:00 e mantém no timezone de São Paulo
            this.due_date = parsedDueDate
                .set({ hour: 15, minute: 0, second: 0, millisecond: 0 })
                .format('YYYY-MM-DDTHH:mm:ss.SSSZ');
        }

        // Mantém status e payment_date originais
        this.status = data.status;
        this.payment_date = data.payment_date;
        this.updated_at = new Date();
    }

    convertMonetaryValue(value) {
        // Se for número, retorna como está
        if (typeof value === 'number') return value;
        
        // Se for string, remove espaços e converte
        if (typeof value === 'string') {
            // Remove R$, espaços e substitui vírgula por ponto
            const cleanedValue = value
                .replace('R$', '')
                .replace(/\s/g, '')
                .replace(',', '.');
            
            // Converte para número
            return parseFloat(cleanedValue);
        }
        
        return value;
    }

    validate() {
        // Valida campos obrigatórios
        if (!this.due_date) {
            throw new Error('Data de vencimento é obrigatória');
        }

        if (!this.amount) {
            throw new Error('Valor é obrigatório');
        }

        return true;
    }
}

module.exports = UpdateInstallmentDTO;
