/**
 * @module auth
 * @description Auth service barrel export.
 *   Exposes consumer and admin route sets for mounting in app.js.
 */

module.exports = {
  consumer: require('./routes/consumer.routes'),
  admin:    require('./routes/admin.routes'),
};
