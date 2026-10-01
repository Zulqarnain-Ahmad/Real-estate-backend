const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Property = require('../models/Property');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/sendEmail');
const { sendBookingReminders } = require('../jobs/bookingCron');
const logAdminAction=require('../utils/auditLogger')

const MAX_ACTIVE_BOOKINGS = 3;

const triggerReminders = catchAsync(async (req, res, next) => {
  await sendBookingReminders();
  res.status(200).json({ status: 'success', message: 'Reminder check triggered manually.' });
});

const createBooking = catchAsync(async (req, res, next) => {
  const { slotId, notes } = req.body;

  const activeBookingsCount = await Booking.countDocuments({
    customer: req.user._id,
    status: { $in: ['pending', 'confirmed'] },
  });

  if (activeBookingsCount >= MAX_ACTIVE_BOOKINGS) {
    return next(
      new AppError(`You already have ${MAX_ACTIVE_BOOKINGS} active bookings. Please complete or cancel one before booking another.`, 400)
    );
  }

  const slot = await Slot.findById(slotId);
  if (!slot) {
    return next(new AppError('Slot not found.', 404));
  }

  if (slot.isBooked) {
    return next(new AppError('This slot has already been booked. Please choose another.', 400));
  }

  const property = await Property.findById(slot.property);
  if (!property) {
    return next(new AppError('Associated property no longer exists.', 404));
  }

  let booking;
  try {
    booking = await Booking.create({
      property: slot.property,
      slot: slot._id,
      customer: req.user._id,
      notes,
    });
  } catch (err) {
    if (err.code === 11000) {
      return next(new AppError('This slot has just been booked by someone else. Please choose another.', 409));
    }
    throw err;
  }

  slot.isBooked = true;
  await slot.save();

  try {
    await sendEmail({
      to: req.user.email,
      subject: 'Booking Confirmed - Property Viewing',
      html: `
        <h2>Your viewing is confirmed</h2>
        <p>Hi ${req.user.name},</p>
        <p>Your viewing for <strong>${property.title}</strong> is confirmed for:</p>
        <p><strong>${new Date(slot.date).toDateString()}</strong> at <strong>${slot.startTime} - ${slot.endTime}</strong></p>
        <p>Location: ${property.location.address}, ${property.location.city}</p>
      `,
    });
  } catch (err) {
    console.error('Failed to send confirmation email:', err.message);
  }

  res.status(201).json({
    status: 'success',
    data: { booking },
  });
});

const getMyBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ customer: req.user._id })
    .populate('property', 'title location price images')
    .populate('slot', 'date startTime endTime')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: { bookings },
  });
});

const cancelBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new AppError('Booking not found.', 404));
  }

  const isOwner = booking.customer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return next(new AppError('You do not have permission to cancel this booking.', 403));
  }

  if (booking.status === 'cancelled') {
    return next(new AppError('This booking is already cancelled.', 400));
  }

  booking.status = 'cancelled';
  booking.cancelledBy = req.user._id;
  booking.cancellationReason = req.body.reason || 'No reason provided';
  await booking.save();

  if(isAdmin){
    await logAdminAction({
      adminId:req.user._id,
      action:'BOOKING_CANCELLED_BY_ADMIN',
      targetId:booking._id,
      targetModel:'Booking',
      details:booking.cancellationReason,
      req,
    })
  }

  await Slot.findByIdAndUpdate(booking.slot, { isBooked: false });

  res.status(200).json({
    status: 'success',
    data: { booking },
  });
});

const getAllBookings = catchAsync(async (req, res, next) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const bookings = await Booking.find(filter)
    .populate('property', 'title location')
    .populate('customer', 'name email phone')
    .populate('slot', 'date startTime endTime')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: { bookings },
  });
});

module.exports = { createBooking, getMyBookings, cancelBooking, getAllBookings, triggerReminders };