const createReviewSchema = {
  rating:  { required: true, type: 'number', min: 1 },
  title:   { type: 'string', maxLength: 100 },
  comment: { type: 'string', maxLength: 1000 },
  size:    { type: 'string' },
};

module.exports = { createReviewSchema };
