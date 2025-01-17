const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');
const PaymentMethod = require('../../payment-methods/model/payment-method.model');

const ContractGroup = sequelize.define('ContractGroup', {
    contract_group_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'contract_group_id'
    },
    group_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'group_name'
    },
    group_description: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'group_description'
    },
    has_decimo_terceiro: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'has_decimo_terceiro'
    },
    vencimento1_dia: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        validate: {
            min: 1,
            max: 31
        },
        field: 'vencimento1_dia'
    },
    vencimento1_mes: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        validate: {
            min: 1,
            max: 12
        },
        field: 'vencimento1_mes'
    },
    vencimento2_dia: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        validate: {
            min: 1,
            max: 31
        },
        field: 'vencimento2_dia'
    },
    vencimento2_mes: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        validate: {
            min: 1,
            max: 12
        },
        field: 'vencimento2_mes'
    },
    decimo_payment_method_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 4,
        field: 'decimo_payment_method_id'
    }
}, {
    tableName: 'contract_groups',
    timestamps: false,
    underscored: true,
    hooks: {
        beforeValidate: (contractGroup) => {
            // Validação condicional para vencimentos quando has_decimo_terceiro é true
            if (contractGroup.has_decimo_terceiro) {
                if (!contractGroup.vencimento1_dia || 
                    !contractGroup.vencimento1_mes || 
                    !contractGroup.vencimento2_dia || 
                    !contractGroup.vencimento2_mes) {
                    throw new Error('Quando has_decimo_terceiro é true, todos os campos de vencimento devem ser preenchidos');
                }
            }
        }
    }
});

// Definir associação com PaymentMethod
ContractGroup.belongsTo(PaymentMethod, {
    foreignKey: 'decimo_payment_method_id',
    as: 'decimoPaymentMethod'
});

module.exports = ContractGroup;
