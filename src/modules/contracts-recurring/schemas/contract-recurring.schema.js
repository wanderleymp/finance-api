const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');

const ContractRecurringSchema = sequelize.define('ContractRecurring', {
    contract_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    contract_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    contract_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    recurrence_period: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    due_day: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    days_before_due: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    status: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: 'active'
    },
    model_movement_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    last_billing_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    next_billing_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    contract_group_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    billing_reference: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'current'
    },
    representative_person_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    commissioned_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    account_entry_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    last_decimo_billing_year: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'contracts_recurring',
    timestamps: false,
    underscored: false
});

module.exports = ContractRecurringSchema;
