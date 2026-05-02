/**
 * @module product
 * @description Product service barrel export.
 */

module.exports = {
  public: require('./routes/public.routes'),
  admin:  require('./routes/admin.routes'),
};
