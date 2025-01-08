const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Person = require('../person/person.model');
const Movement = require('../movement/movement.model');

const Invoice = sequelize.define('Invoice', {
  invoice_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'invoice_id'
  },
  reference_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'reference_id'
  },
  type: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'type'
  },
  number: {
    type: DataTypes.STRING(50),
    field: 'number'
  },
  series: {
    type: DataTypes.STRING(20),
    field: 'series'
  },
  status: {
    type: DataTypes.STRING(20),
    field: 'status'
  },
  environment: {
    type: DataTypes.STRING(20),
    field: 'environment'
  },
  pdf_url: {
    type: DataTypes.TEXT,
    field: 'pdf_url'
  },
  xml_url: {
    type: DataTypes.TEXT,
    field: 'xml_url'
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'total_amount'
  },
  movement_id: {
    type: DataTypes.INTEGER,
    field: 'movement_id',
    references: {
      model: Movement,
      key: 'movement_id'
    }
  },
  integration_id: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    field: 'integration_id'
  },
  emitente_person_id: {
    type: DataTypes.INTEGER,
    field: 'emitente_person_id',
    references: {
      model: Person,
      key: 'person_id'
    }
  },
  destinatario_person_id: {
    type: DataTypes.INTEGER,
    field: 'destinatario_person_id',
    references: {
      model: Person,
      key: 'person_id'
    }
  }
}, {
  tableName: 'invoices',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define associations
Invoice.belongsTo(Person, { 
  as: 'emitente', 
  foreignKey: 'emitente_person_id' 
});
Invoice.belongsTo(Person, { 
  as: 'destinatario', 
  foreignKey: 'destinatario_person_id' 
});
Invoice.belongsTo(Movement, { 
  foreignKey: 'movement_id' 
});

module.exports = Invoice;
