const User = require('../models/User');
const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const logAdminAction = require('../utils/auditLogger');

const getAllUsers = catchAsync(async (req, res, next) => {
  const { role, active, search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (active !== undefined) filter.active = active === 'true';
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter).select('+active').sort('-createdAt').skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: users.length,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
    data: { users },
  });
});

const getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('+active');

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  const bookings = await Booking.find({ customer: user._id })
    .populate('property', 'title location')
    .populate('slot', 'date startTime endTime')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    data: { user, bookings },
  });
});

const disableUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('+active');

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  if (user.role === 'admin') {
    return next(new AppError('Cannot disable another admin account.', 403));
  }

  user.active = false;
  await user.save({ validateBeforeSave: false });

  await logAdminAction({
    adminId: req.user._id,
    action: 'USER_DISABLED',
    targetId: user._id,
    targetModel: 'User',
    details: `Disabled user: ${user.email}`,
    req,
  });

  res.status(200).json({
    status: 'success',
    message: 'User account disabled.',
    data: { user },
  });
});

const enableUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('+active');

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  user.active = true;
  await user.save({ validateBeforeSave: false });

  await logAdminAction({
    adminId: req.user._id,
    action: 'USER_ENABLED',
    targetId: user._id,
    targetModel: 'User',
    details: `Re-enabled user: ${user.email}`,
    req,
  });

  res.status(200).json({
    status: 'success',
    message: 'User account re-enabled.',
    data: { user },
  });
});

const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  if (user.role === 'admin') {
    return next(new AppError('Cannot delete another admin account.', 403));
  }

  const activeBookings = await Booking.countDocuments({
    customer: user._id,
    status: { $in: ['pending', 'confirmed'] },
  });

  if (activeBookings > 0) {
    return next(
      new AppError('Cannot delete a user with active bookings. Cancel their bookings first, or disable the account instead.', 400)
    );
  }

  await logAdminAction({
    adminId: req.user._id,
    action: 'USER_DELETED',
    targetId: user._id,
    targetModel: 'User',
    details: `Deleted user: ${user.email}`,
    req,
  });

  await User.findByIdAndDelete(req.params.id);

  res.status(204).json({ status: 'success', data: null });
});

module.exports = { getAllUsers, getUserById, disableUser, enableUser, deleteUser };