const TimeOff = require('../models/TimeOff');
const TimeOffAllocation = require('../models/TimeOffAllocation');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const { sendLeaveStatusEmail } = require('../services/emailService');

// @desc    Apply for leave
// @route   POST /api/timeoff/apply
// @access  Private
const applyLeave = async (req, res, next) => {
  try {
    const employeeId = req.user.employee._id || req.user.employee;
    const companyId = req.user.company._id || req.user.company;
    const { leaveType, startDate, endDate, reason } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start < new Date().setHours(0, 0, 0, 0)) {
      return next(new AppError('Cannot apply for leave in the past', 400));
    }

    if (end < start) {
      return next(new AppError('End date must be after start date', 400));
    }

    // Calculate total days
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check allocation availability (not for unpaid leaves)
    if (leaveType !== 'unpaid_leave') {
      const year = new Date().getFullYear();
      const allocation = await TimeOffAllocation.findOne({
        employee: employeeId,
        leaveType,
        year
      });

      if (!allocation) {
        return next(new AppError('No leave allocation found for this type', 400));
      }

      if (allocation.remaining < totalDays) {
        return next(new AppError(`Insufficient leave balance. Available: ${allocation.remaining} days`, 400));
      }
    }

    // Check for overlapping requests
    const overlapping = await TimeOff.findOne({
      employee: employeeId,
      status: { $ne: 'rejected' },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlapping) {
      return next(new AppError('You already have a leave request for overlapping dates', 400));
    }

    const timeOff = await TimeOff.create({
      employee: employeeId,
      company: companyId,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      attachment: req.file ? `/uploads/attachments/${req.file.filename}` : ''
    });

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: { timeOff }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my leave requests
// @route   GET /api/timeoff/my
// @access  Private
const getMyLeaves = async (req, res, next) => {
  try {
    const employeeId = req.user.employee._id || req.user.employee;
    const { status, leaveType, year } = req.query;

    let query = { employee: employeeId };

    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    if (year) {
      query.startDate = {
        $gte: new Date(parseInt(year), 0, 1),
        $lte: new Date(parseInt(year), 11, 31)
      };
    }

    const leaves = await TimeOff.find(query)
      .sort({ createdAt: -1 });

    // Get allocations
    const currentYear = parseInt(year) || new Date().getFullYear();
    const allocations = await TimeOffAllocation.find({
      employee: employeeId,
      year: currentYear
    });

    res.status(200).json({
      success: true,
      data: {
        leaves,
        allocations: allocations.reduce((acc, alloc) => {
          acc[alloc.leaveType] = {
            total: alloc.totalAllocated,
            used: alloc.used,
            remaining: alloc.remaining
          };
          return acc;
        }, {})
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all leave requests (Admin/HR)
// @route   GET /api/timeoff
// @access  Private (Admin/HR)
const getAllLeaves = async (req, res, next) => {
  try {
    const companyId = req.user.company._id || req.user.company;
    const { status, leaveType, employeeId, page = 1, limit = 20 } = req.query;

    let query = { company: companyId };

    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    if (employeeId) query.employee = employeeId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const leaves = await TimeOff.find(query)
      .populate('employee', 'firstName lastName employeeCode avatar')
      .populate('approvedBy', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TimeOff.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        leaves,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Reject leave
// @route   PUT /api/timeoff/:id/status
// @access  Private (Admin/HR)
const updateLeaveStatus = async (req, res, next) => {
  try {
    const { status, adminComments, rejectionReason } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return next(new AppError('Status must be approved or rejected', 400));
    }

    const timeOff = await TimeOff.findById(req.params.id).populate('employee');

    if (!timeOff) {
      return next(new AppError('Leave request not found', 404));
    }

    if (timeOff.status !== 'pending') {
      return next(new AppError('This leave request has already been processed', 400));
    }

    timeOff.status = status;
    timeOff.approvedBy = req.user._id;
    timeOff.approvedAt = new Date();
    timeOff.adminComments = adminComments || '';
    timeOff.rejectionReason = rejectionReason || '';
    await timeOff.save();

    // If approved, update allocation and mark attendance as leave
    if (status === 'approved') {
      // Update allocation
      if (timeOff.leaveType !== 'unpaid_leave') {
        const year = new Date(timeOff.startDate).getFullYear();
        await TimeOffAllocation.findOneAndUpdate(
          { employee: timeOff.employee._id, leaveType: timeOff.leaveType, year },
          { $inc: { used: timeOff.totalDays, remaining: -timeOff.totalDays } }
        );
      }

      // Mark attendance as on_leave for the leave days
      const start = new Date(timeOff.startDate);
      const end = new Date(timeOff.endDate);
      const current = new Date(start);

      while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
          await Attendance.findOneAndUpdate(
            { employee: timeOff.employee._id, date: new Date(current) },
            {
              employee: timeOff.employee._id,
              company: timeOff.company,
              date: new Date(current),
              status: 'on_leave',
              isAutoGenerated: true
            },
            { upsert: true, new: true }
          );
        }
        current.setDate(current.getDate() + 1);
      }

      // Update employee work status
      const today = new Date();
      if (today >= timeOff.startDate && today <= timeOff.endDate) {
        await Employee.findByIdAndUpdate(timeOff.employee._id, {
          workStatus: 'on_leave'
        });
      }
    }

    // Send email notification
    const employee = await Employee.findById(timeOff.employee._id).populate('user', 'email');
    if (employee && employee.user) {
      await sendLeaveStatusEmail(
        employee.user.email,
        employee.fullName,
        status,
        timeOff.leaveType.replace(/_/g, ' '),
        timeOff.startDate,
        timeOff.endDate
      );
    }

    res.status(200).json({
      success: true,
      message: `Leave request ${status} successfully`,
      data: { timeOff }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leave allocations
// @route   GET /api/timeoff/allocations
// @access  Private
const getAllocations = async (req, res, next) => {
  try {
    const employeeId = req.query.employeeId || (req.user.employee._id || req.user.employee);
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const allocations = await TimeOffAllocation.find({
      employee: employeeId,
      year
    });

    res.status(200).json({
      success: true,
      data: { allocations }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update allocation (Admin)
// @route   PUT /api/timeoff/allocations/:id
// @access  Private (Admin/HR)
const updateAllocation = async (req, res, next) => {
  try {
    const { totalAllocated } = req.body;
    
    const allocation = await TimeOffAllocation.findById(req.params.id);
    if (!allocation) {
      return next(new AppError('Allocation not found', 404));
    }

    allocation.totalAllocated = totalAllocated;
    allocation.remaining = totalAllocated - allocation.used;
    await allocation.save();

    res.status(200).json({
      success: true,
      data: { allocation }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  getAllocations,
  updateAllocation
};