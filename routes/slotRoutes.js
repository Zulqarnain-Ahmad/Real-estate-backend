const express = require('express');
const { createSlot, getSlotsForProperty, deleteSlot } = require('../controllers/slotController');
const { validateSlot } = require('../middleware/validators/bookingValidators');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/property/:propertyId',getSlotsForProperty);

router.use(protect,restrictTo('admin'));
router.post('/',validateSlot,createSlot);
router.delete('/:id',deleteSlot)

module.exports=router