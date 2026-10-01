const Joi = require('joi');
const AppError = require('../../utils/AppError');

const validateProperty = (req, res, next) => {
  if (req.body.location && typeof req.body.location === 'string') {
    try {
      req.body.location = JSON.parse(req.body.location);
    } catch (err) {
      return next(new AppError('Invalid location format.', 400));
    }
  }

  if (req.body.amenities && typeof req.body.amenities === 'string') {
    try {
      req.body.amenities = JSON.parse(req.body.amenities);
    } catch (err) {
      return next(new AppError('Invalid amenities format.', 400));
    }
  }

  const schema = Joi.object({
    title: Joi.string().trim().max(100).required(),
    description: Joi.string().max(3000).required(),
    price: Joi.number().min(0).required(),
    propertyType: Joi.string()
      .valid('house', 'apartment', 'villa', 'penthouse', 'land', 'commercial')
      .required(),
    bedrooms: Joi.number().min(0).optional(),
    bathrooms: Joi.number().min(0).optional(),
    areaSqft: Joi.number().min(0).required(),
    location: Joi.object({
      address: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().allow('').optional(),
      country: Joi.string().required(),
      coordinates: Joi.object({
        lat: Joi.number().optional(),
        lng: Joi.number().optional(),
      }).optional(),
    }).required(),
    amenities: Joi.array().items(Joi.string()).optional(),
    isFeatured: Joi.boolean().optional(),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join('. ');
    return next(new AppError(message, 400));
  }

  next();
};

module.exports = { validateProperty };