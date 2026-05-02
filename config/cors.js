const env = require('./env');

const corsOptions = {
  origin: [env.cors.adminUrl, env.cors.frontendUrl],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = corsOptions;
