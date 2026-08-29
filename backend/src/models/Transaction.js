const mongoose = require('mongoose');
const { TRANSACTION_STATUS, RISK_LEVEL } = require('../config/constants');
const { generateTransactionId } = require('../utils/ids');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiver: {
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
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.PENDING,
      index: true,
    },
    riskLevel: {
      type: String,
      enum: Object.values(RISK_LEVEL),
      default: RISK_LEVEL.LOW,
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riskFactors: {
      type: [String],
      default: [],
    },
    failureReason: {
      type: String,
      default: '',
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    reversedAt: Date,
    reversedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ sender: 1, createdAt: -1 });
transactionSchema.index({ receiver: 1, createdAt: -1 });

transactionSchema.pre('validate', function assignTxnId(next) {
  if (!this.transactionId) {
    this.transactionId = generateTransactionId();
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
