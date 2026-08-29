const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function errorHandler(err, req, res, next) {
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'A record with that value already exists' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid identifier' });
  }

  const status = err.statusCode || 500;
  const payload = {
    success: false,
    message: err.isOperational ? err.message : 'Internal server error',
  };

  if (err.details) {
    payload.details = err.details;
  }

  if (env.nodeEnv === 'development' && !err.isOperational) {
    payload.stack = err.stack;
    payload.message = err.message;
  }

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json(payload);
}

module.exports = errorHandler;
