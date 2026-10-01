const Booking = require('../models/Booking');
const Property = require('../models/Property');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const catchAsync = require('../utils/catchAsync');

const getDashboardStats = catchAsync(async (req, res, next) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalProperties,
    availableProperties,
    soldProperties,
    totalUsers,
    totalCustomers,
    bookingsLast7Days,
    bookingsLast30Days,
    totalCancelledBookings,
    totalConfirmedBookings,
    mostViewedProperties,
  ] = await Promise.all([
    Property.countDocuments(),
    Property.countDocuments({ status: 'available' }),
    Property.countDocuments({ status: 'sold' }),
    User.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Booking.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Booking.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Booking.countDocuments({ status: 'cancelled' }),
    Booking.countDocuments({ status: 'confirmed' }),
    Property.find().sort('-views').limit(5).select('title views price location'),
  ]);

  const totalBookingsAllTime = totalCancelledBookings + totalConfirmedBookings;
  const cancellationRate =
    totalBookingsAllTime > 0 ? ((totalCancelledBookings / totalBookingsAllTime) * 100).toFixed(1) : 0;

  res.status(200).json({
    status: 'success',
    data: {
      properties: {
        total: totalProperties,
        available: availableProperties,
        sold: soldProperties,
      },
      users: {
        total: totalUsers,
        customers: totalCustomers,
      },
      bookings: {
        last7Days: bookingsLast7Days,
        last30Days: bookingsLast30Days,
        totalConfirmed: totalConfirmedBookings,
        totalCancelled: totalCancelledBookings,
        cancellationRate: `${cancellationRate}%`,
      },
      mostViewedProperties,
    },
  });
});

const getAuditLogs = catchAsync(async (req, res, next) => {
  const { action, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (action) filter.action = action;

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('admin', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    AuditLog.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: logs.length,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
    data: { logs },
  });
});

module.exports = { getDashboardStats, getAuditLogs };