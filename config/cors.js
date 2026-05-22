const env = require('./env');

const corsOptions = {
  origin: [env.cors.adminUrl, env.cors.frontendUrl, 'http://localhost:5175', 'http://localhost:8081'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = corsOptions;
