const { check } = require('express-validator');

exports.validateProduct = [
  check('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim(),
    
  check('url')
    .isURL()
    .withMessage('Invalid URL format')
    .custom(value => value.includes('flipkart.com'))
    .withMessage('URL must be from Flipkart'),
    
  check('currentPrice')
    .isFloat({ gt: 0 })
    .withMessage('Price must be a positive number')
];