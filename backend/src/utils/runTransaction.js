const mongoose = require('mongoose');

/**
 * Runs work inside a MongoDB multi-document transaction when the deployment
 * supports it (replica set / Atlas). Falls back to sequential atomic writes
 * on a standalone node so local hackathon setups still work.
 */
async function runInTransaction(work) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    try {
      await session.abortTransaction();
    } catch {
      /* session may already be aborted */
    }

    const standalone =
      error.code === 20 ||
      /replica set|Transaction numbers are only allowed/i.test(error.message || '');

    if (standalone) {
      return work(null);
    }

    throw error;
  } finally {
    session.endSession();
  }
}

module.exports = { runInTransaction };
