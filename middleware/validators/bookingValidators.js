const Joi = require('joi');
const AppError = require('../../utils/AppError');

const validateSlot = (req, res, next) => {
  const schema = Joi.object({
    property: Joi.string().hex().length(24).required(),
    date: Joi.date().greater('now').required(),
    startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
    endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join('. ');
    return next(new AppError(message, 400));
  }
  next();
};

const validateBooking = (req, res, next) => {
  const schema = Joi.object({
    slotId: Joi.string().hex().length(24).required(),
    notes: Joi.string().max(500).allow('').optional(),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join('. ');
    return next(new AppError(message, 400));
  }
  next();
};

module.exports = { validateSlot, validateBooking };