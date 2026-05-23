const env = require('./env');

const allowedOrigins = [
  'https://oopsfashion.in',
  'https://www.oopsfashion.in',
  'https://oops-frontend.pages.dev',
  env.cors.adminUrl,
  env.cors.frontendUrl,
  process.env.FRONTEND_DEPLOY_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = corsOptions;
