const Joi = require('joi');
const AppError = require('../../utils/AppError');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const message = error.details.map((detail) => detail.message).join('. ');
      return next(new AppError(message, 400));
    }

    next();
  };
};

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
  }),
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.email': 'Please provide a valid email',
    'string.empty': 'Email is required',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/\d/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one number',
      'string.empty': 'Password is required',
    }),
  phone: Joi.string().trim().optional().allow(''),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    'string.email': 'Please provide a valid email',
    'string.empty': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
};