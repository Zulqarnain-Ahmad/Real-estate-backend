const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'PROPERTY_DELETED',
        'USER_DISABLED',
        'USER_ENABLED',
        'USER_DELETED',
        'BOOKING_CANCELLED_BY_ADMIN',
      ],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetModel: {
      type: String,
      required: true,
      enum: ['Property', 'User', 'Booking'],
    },
    details: {
      type: String,
    },
    ipAddress: String,
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);