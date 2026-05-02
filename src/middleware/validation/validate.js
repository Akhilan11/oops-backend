/**
 * @module middleware/validation/validate
 * @description Generic request-body validation runner.
 *   Accepts a schema object and checks each field against its rules.
 *
 *   Supported rules per field:
 *     required, type ('string'|'number'|'array'|'object'),
 *     minLength, maxLength, min, enum, match + matchMessage, custom(value, body)
 */

const ApiError = require('../../utils/ApiError');

/**
 * Create a validation middleware from a schema definition.
 *
 * @param {Object} schema - Map of field names to rule objects
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   const schema = {
 *     email: { required: true, type: 'string', match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
 *     password: { required: true, type: 'string', minLength: 6 },
 *   };
 *   router.post('/login', validate(schema), controller.login);
 */
const validate = (schema) => (req, res, next) => {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = req.body[field];

    // ── Required check ──
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({ field, message: `${field} is required` });
      continue;
    }

    if (value === undefined || value === null || value === '') continue;

    // ── Type checks ──
    if (rules.type === 'string' && typeof value !== 'string') {
      errors.push({ field, message: `${field} must be a string` });
      continue;
    }
    if (rules.type === 'number' && typeof value !== 'number') {
      errors.push({ field, message: `${field} must be a number` });
      continue;
    }
    if (rules.type === 'array' && !Array.isArray(value)) {
      errors.push({ field, message: `${field} must be an array` });
      continue;
    }

    // ── String length ──
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      errors.push({ field, message: `${field} must be at least ${rules.minLength} characters` });
    }
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      errors.push({ field, message: `${field} must be at most ${rules.maxLength} characters` });
    }

    // ── Enum ──
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push({ field, message: `${field} must be one of: ${rules.enum.join(', ')}` });
    }

    // ── Regex match ──
    if (rules.match && !rules.match.test(value)) {
      errors.push({ field, message: rules.matchMessage || `${field} format is invalid` });
    }

    // ── Numeric min ──
    if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
      errors.push({ field, message: `${field} must be at least ${rules.min}` });
    }

    // ── Custom validator ──
    if (rules.custom) {
      const err = rules.custom(value, req.body);
      if (err) errors.push({ field, message: err });
    }
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  next();
};

module.exports = validate;
