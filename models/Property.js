const mongoose=require('mongoose');
const slugify=require('slugify');

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    propertyType: {
      type: String,
      enum: ['house', 'apartment', 'villa', 'penthouse', 'land', 'commercial'],
      required: [true, 'Property type is required'],
    },
    bedrooms: {
      type: Number,
      min: 0,
      default: 0,
    },
    bathrooms: {
      type: Number,
      min: 0,
      default: 0,
    },
    areaSqft: {
      type: Number,
      required: [true, 'Area is required'],
      min: [0, 'Area cannot be negative'],
    },
    location: {
      address: { type: String, required: [true, 'Address is required'] },
      city: { type: String, required: [true, 'City is required'] },
      state: String,
      country: { type: String, required: [true, 'Country is required'] },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    amenities: {
      type: [String],
      default: [],
    },
images: [
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
],
    status: {
      type: String,
      enum: ['available', 'pending', 'sold'],
      default: 'available',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

propertySchema.pre('save', function () {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Date.now().toString().slice(-5);
  }
});

propertySchema.index({title:'text',description:'text','location.city':'text'})
propertySchema.index({price:1});
propertySchema.index({status:1});

module.exports=mongoose.model('Property',propertySchema)