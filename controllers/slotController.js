const Slot = require('../models/Slot');
const Property = require('../models/Property');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const createSlot = catchAsync(async (req, res, next) => {
  const { property, date, startTime, endTime } = req.body;

  const propertyExists = await Property.findById(property);
  if (!propertyExists) {
    return next(new AppError('Property not found.', 404));
  }

  if (startTime >= endTime) {
    return next(new AppError('Start time must be before end time.', 400));
  }

  const slot = await Slot.create({
    property,
    date,
    startTime,
    endTime,
    createdBy: req.user._id,
  });

  res.status(201).json({
    status: 'success',
    data: { slot },
  });
});

const getSlotsForProperty = catchAsync(async (req, res, next) => {
  const { propertyId } = req.params;
  const { availableOnly } = req.query;

  const filter = { property: propertyId, date: { $gte: new Date() } };
  if (availableOnly === 'true') {
    filter.isBooked = false;
  }

  const slots = await Slot.find(filter).sort('date startTime');

  res.status(200).json({
    status: 'success',
    results: slots.length,
    data: { slots },
  });
});

const deleteSlot = catchAsync(async (req, res, next) => {
  const slot = await Slot.findById(req.params.id);

  if (!slot) {
    return next(new AppError('Slot not found.', 404));
  }

  if (slot.isBooked) {
    return next(new AppError('Cannot delete a slot that already has a booking. Cancel the booking first.', 400));
  }

  await Slot.findByIdAndDelete(req.params.id);

  res.status(204).json({ status: 'success', data: null });
});

module.exports = { createSlot, getSlotsForProperty, deleteSlot };