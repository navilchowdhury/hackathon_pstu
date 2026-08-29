const mongoose = require('mongoose');
const env = require('./env');

async function connectDatabase() {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongoUri);

  const { host, name } = mongoose.connection;
  console.log(`MongoDB connected: ${host}/${name}`);
}

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

module.exports = { connectDatabase };
