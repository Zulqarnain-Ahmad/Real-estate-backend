const express = require('express');
const { getAllUsers, getUserById, disableUser, enableUser, deleteUser } = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.patch('/:id/disable', disableUser);
router.patch('/:id/enable', enableUser);
router.delete('/:id', deleteUser);

module.exports = router;