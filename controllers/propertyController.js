const Property = require('../models/Property');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const cloudinary=require('../config/cloudinary')
const Booking=require('../models/Booking');
const Slot=require('../models/Slot')
const logAdminAction=require('../utils/auditLogger')

const createProperty = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('At least one property image is required.', 400));
  }

const images = req.files.map((file) => ({
  url: file.path,
  publicId: file.filename,
}));

  const property = await Property.create({
    ...req.body,
    images,
    createdBy: req.user._id,
  });

  res.status(201).json({
    status: 'success',
    data: { property },
  });
});

const getAllProperties = catchAsync(async (req, res, next) => {
  const { city, propertyType, minPrice, maxPrice, bedrooms, status, search, sort, page = 1, limit = 12 } = req.query;

  const filter = {};

  if (city) filter['location.city'] = new RegExp(city, 'i');
  if (propertyType) filter.propertyType = propertyType;
  if (bedrooms) filter.bedrooms = { $gte: Number(bedrooms) };
  if (status) filter.status = status;
  else filter.status = { $ne: 'sold' };

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const sortOptions = {
    priceAsc: 'price',
    priceDesc: '-price',
    newest: '-createdAt',
    oldest: 'createdAt',
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .sort(sortOptions[sort] || '-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Property.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: properties.length,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
    data: { properties },
  });
});

const getProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findOne({ slug: req.params.slug });

  if (!property) {
    return next(new AppError('Property not found.', 404));
  }

  property.views += 1;
  await property.save();

  res.status(200).json({
    status: 'success',
    data: { property },
  });
});

const updateProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(new AppError('Property not found.', 404));
  }

  if (req.files && req.files.length > 0) {
    for (const image of property.images) {
      await cloudinary.uploader.destroy(image.publicId);
    }
    req.body.images = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));
  
}

  const updatedProperty = await Property.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: { property: updatedProperty },
  });
});



const deleteProperty=catchAsync(async(req,res,next)=>{
  const property=await Property.findById(req.params.id);

  if(!property){
    return next(new AppError('Property not found.',404))
  }


  const activeBookings=await Booking.countDocuments({
    property:property._id,
    status: { $in: ['pending', 'confirmed'] },
  });

  if(activeBookings >0){
    return next(
      new AppError (`Cannot delete this property: it has ${activeBookings} active booking(s). Cancel them first.`,400)
    )

  }


  await logAdminAction({
      adminId: req.user._id,
    action: 'PROPERTY_DELETED',
    targetId: property._id,
    targetModel: 'Property',
    details: `Deleted property: ${property.title}`,
    req,
  })

  for (const image of property.images) {
    await cloudinary.uploader.destroy(image.publicId);
  }

  await Slot.deleteMany({ property: property._id });
  await Property.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
})

module.exports = {
  createProperty,
  getAllProperties,
  getProperty,
  updateProperty,
  deleteProperty,
};