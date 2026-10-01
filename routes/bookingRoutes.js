const express = require('express');
const { validateBooking } = require('../middleware/validators/bookingValidators');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { bookingLimiter } = require('../middleware/rateLimiters');
const { createBooking, getMyBookings, cancelBooking, getAllBookings, triggerReminders } = require('../controllers/bookingController');



const router = express.Router();

router.use(protect);

router.post('/',bookingLimiter,validateBooking,createBooking);
router.post('/trigger-reminders',restrictTo('admin'),triggerReminders)
router.get('/my-bookings',getMyBookings);
router.patch('/:id/cancel',cancelBooking);

router.get('/',restrictTo('admin'),getAllBookings);

module.exports=router;