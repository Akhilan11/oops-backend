const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../src/utils/logger');

const connectDB = async () => {
  const MAX_RETRIES = 5;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      await mongoose.connect(env.mongoUri);
      logger.info('MongoDB connected');
      return;
    } catch (err) {
      attempt++;
      logger.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
      if (attempt >= MAX_RETRIES) {
        logger.error('MongoDB connection failed after max retries');
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err.message}`);
});

module.exports = connectDB;
