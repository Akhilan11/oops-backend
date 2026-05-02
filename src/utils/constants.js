const ORDER_STATUSES = ['placed', 'processing', 'shipped', 'out-for-delivery', 'delivered'];

const PRODUCT_STATUSES = ['available', 'sold-out', 'coming-soon'];

const OTP_PURPOSES = ['signup', 'login', 'reset-password', 'admin-2fa'];

const ROLES = ['customer', 'admin'];

const GENDERS = ['', 'male', 'female', 'other'];

const PAYMENT_METHODS = ['prepaid', 'cod'];

const PAYMENT_STATUSES = ['pending', 'paid', 'failed'];

const COD_FEE = 49;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MAX_OTP_ATTEMPTS = 5;

const OTP_EXPIRY_MINUTES = 5;

module.exports = {
  ORDER_STATUSES,
  PRODUCT_STATUSES,
  OTP_PURPOSES,
  ROLES,
  GENDERS,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  COD_FEE,
  ALLOWED_IMAGE_TYPES,
  MAX_OTP_ATTEMPTS,
  OTP_EXPIRY_MINUTES,
};
