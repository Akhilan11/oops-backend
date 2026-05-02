const env = require('./config/env');
const connectDB = require('./config/database');
const app = require('./app');
const logger = require('./src/utils/logger');
const mongoose = require('mongoose');

const start = async () => {
  await connectDB();

  const server = app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} [${env.nodeEnv}]`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
      } catch (e) { /* ignore */ }
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled rejection:', err);
  });
};

start();
