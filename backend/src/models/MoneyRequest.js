const mongoose = require('mongoose');
const { MONEY_REQUEST_STATUS } = require('../config/constants');

const moneyRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 240,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(MONEY_REQUEST_STATUS),
      default: MONEY_REQUEST_STATUS.PENDING,
      index: true,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
  },
  { timestamps: true }
);

moneyRequestSchema.index({ requester: 1, createdAt: -1 });
moneyRequestSchema.index({ payer: 1, createdAt: -1 });

module.exports = mongoose.model('MoneyRequest', moneyRequestSchema);
