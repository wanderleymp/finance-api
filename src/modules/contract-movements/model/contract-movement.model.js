const { DataTypes } = require('sequelize');
const sequelize = require('../../../config/database');
const ContractRecurring = require('../../contracts-recurring/model/contract-recurring.model');
const Movement = require('../../movements/model/movement.model');

const ContractMovement = sequelize.define('ContractMovement', {
    contract_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'contract_id',
        references: {
            model: ContractRecurring,
            key: 'contract_id'
        }
    },
    movement_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'movement_id',
        references: {
            model: Movement,
            key: 'movement_id'
        }
    }
}, {
    tableName: 'contract_movements',
    timestamps: false,
    underscored: true
});

// Definir associações
ContractMovement.belongsTo(ContractRecurring, { 
    foreignKey: 'contract_id', 
    as: 'contractRecurring' 
});

ContractMovement.belongsTo(Movement, { 
    foreignKey: 'movement_id', 
    as: 'movement' 
});

module.exports = ContractMovement;
