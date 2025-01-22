const mongoose = require('mongoose');

const contractAdjustmentHistorySchema = new mongoose.Schema({
  contractId: {
    type: Number,
    required: true,
    ref: 'ContractRecurring'
  },
  previousValue: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  newValue: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  changeDate: {
    type: Date,
    default: Date.now
  },
  changeType: {
    type: String,
    required: true,
    maxlength: 50
  },
  changedBy: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ContractAdjustmentHistory', contractAdjustmentHistorySchema);
