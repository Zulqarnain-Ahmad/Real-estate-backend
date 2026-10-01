const express = require('express');
const {
  createProperty,
  getAllProperties,
  getProperty,
  updateProperty,
  deleteProperty,
} = require('../controllers/propertyController');
const { validateProperty } = require('../middleware/validators/propertyValidators');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();


router.get('/',getAllProperties);
router.get('/:slug',getProperty);

router.use(protect,restrictTo('admin'));

router.post('/', upload.array('images', 10), validateProperty, createProperty);
router.patch('/:id', upload.array('images', 10), updateProperty);
router.delete('/:id', deleteProperty);

module.exports = router;
