/**
 * @module order
 * @description Order service barrel export.
 */

module.exports = {
  consumer: require('./routes/consumer.routes'),
  admin:    require('./routes/admin.routes'),
};
