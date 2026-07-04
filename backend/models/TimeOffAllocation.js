const mongoose = require('mongoose');

const timeOffAllocationSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['paid_time_off', 'sick_leave', 'unpaid_leave'],
    required: true
  },
  totalAllocated: {
    type: Number,
    required: true
  },
  used: {
    type: Number,
    default: 0
  },
  remaining: {
    type: Number,
    default: 0
  },
  validityStart: {
    type: Date,
    required: true
  },
  validityEnd: {
    type: Date,
    required: true
  },
  year: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Calculate remaining before saving
timeOffAllocationSchema.pre('save', function(next) {
  this.remaining = this.totalAllocated - this.used;
  next();
});

// Compound index
timeOffAllocationSchema.index({ employee: 1, leaveType: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('TimeOffAllocation', timeOffAllocationSchema);