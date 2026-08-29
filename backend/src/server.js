const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const { connectDatabase } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');
const authRoutes = require('./routes/auth.routes');
const walletRoutes = require('./routes/wallet.routes');
const transactionRoutes = require('./routes/transaction.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const groupRoutes = require('./routes/group.routes');
const requestRoutes = require('./routes/request.routes');

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    // Allow the Vite app (another origin) to read API responses.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, service: 'SecurePay API', status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/requests', requestRoutes);

app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
});

app.use(errorHandler);

async function start() {
  await connectDatabase();

  const server = app.listen(env.port, '127.0.0.1', () => {
    console.log(`SecurePay API listening on http://127.0.0.1:${env.port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `Port ${env.port} is already in use. Close the other backend terminal (Ctrl+C) and run npm run dev once.`
      );
      process.exit(1);
    }
    throw err;
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
