const express = require('express');
const { getDashboardStats, getAuditLogs } = require('../controllers/analyticsController');
const { protect, restrictTo } = require('../middleware/authMiddleware');


const router=express.Router();

router.use(protect,restrictTo('admin'));

router.get('/dashboard',getDashboardStats);
router.get('/audit-logs',getAuditLogs);

module.exports=router;
