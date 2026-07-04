const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const { getDateRange, getMonthRange, calculateWorkingDays } = require('../utils/helpers');

// @desc    Check In
// @route   POST /api/attendance/checkin
// @access  Private
const checkIn = async (req, res, next) => {
  try {
    const employeeId = req.user.employee._id || req.user.employee;
    const companyId = req.user.company._id || req.user.company;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employee: employeeId,
      date: today
    });

    if (existingAttendance && existingAttendance.checkIn && !existingAttendance.checkOut) {
      return next(new AppError('Already checked in. Please check out first.', 400));
    }

    if (existingAttendance && existingAttendance.checkOut) {
      return next(new AppError('Already checked in and out for today.', 400));
    }

    // Create attendance record
    const attendance = await Attendance.create({
      employee: employeeId,
      company: companyId,
      date: today,
      checkIn: now,
      status: 'present'
    });

    // Update employee check-in status
    await Employee.findByIdAndUpdate(employeeId, {
      isCheckedIn: true,
      lastCheckIn: now
    });

    res.status(200).json({
      success: true,
      message: 'Checked in successfully',
      data: { attendance }
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Attendance already recorded for today.', 400));
    }
    next(error);
  }
};

// @desc    Check Out
// @route   POST /api/attendance/checkout
// @access  Private
const checkOut = async (req, res, next) => {
  try {
    const employeeId = req.user.employee._id || req.user.employee;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today,
      checkIn: { $ne: null },
      checkOut: null
    });

    if (!attendance) {
      return next(new AppError('No active check-in found. Please check in first.', 400));
    }

    attendance.checkOut = now;
    await attendance.save(); // This triggers the pre-save hook for work hours calculation

    // Update employee status
    await Employee.findByIdAndUpdate(employeeId, {
      isCheckedIn: false
    });

    res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      data: { attendance }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance (Employee - own records)
// @route   GET /api/attendance/my
// @access  Private
const getMyAttendance = async (req, res, next) => {
  try {
    const employeeId = req.user.employee._id || req.user.employee;
    const { month, year, page = 1, limit = 31 } = req.query;

    const currentDate = new Date();
    const queryMonth = parseInt(month) || currentDate.getMonth() + 1;
    const queryYear = parseInt(year) || currentDate.getFullYear();

    const { start, end } = getMonthRange(queryYear, queryMonth);

    const attendance = await Attendance.find({
      employee: employeeId,
      date: { $gte: start, $lte: end }
    }).sort({ date: -1 });

    // Calculate summary
    const totalWorkingDays = calculateWorkingDays(start, end);
    const presentDays = attendance.filter(a => a.status === 'present').length;
    const halfDays = attendance.filter(a => a.status === 'half_day').length;
    const leaveDays = attendance.filter(a => a.status === 'on_leave').length;
    const absentDays = totalWorkingDays - presentDays - halfDays - leaveDays;

    res.status(200).json({
      success: true,
      data: {
        attendance,
        summary: {
          totalWorkingDays,
          presentDays,
          halfDays,
          leaveDays,
          absentDays,
          totalWorkedHours: attendance.reduce((sum, a) => sum + a.workHours, 0).toFixed(2),
          totalExtraHours: attendance.reduce((sum, a) => sum + a.extraHours, 0).toFixed(2)
        },
        month: queryMonth,
        year: queryYear
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all attendance (Admin/HR)
// @route   GET /api/attendance
// @access  Private (Admin/HR)
const getAllAttendance = async (req, res, next) => {
  try {
    const companyId = req.user.company._id || req.user.company;
    const { date, month, year, employeeId, status, page = 1, limit = 50 } = req.query;

    let query = { company: companyId };

    if (date) {
      const { start, end } = getDateRange(new Date(date));
      query.date = { $gte: start, $lte: end };
    } else if (month && year) {
      const { start, end } = getMonthRange(parseInt(year), parseInt(month));
      query.date = { $gte: start, $lte: end };
    } else {
      // Default to today
      const today = new Date();
      const { start, end } = getDateRange(today);
      query.date = { $gte: start, $lte: end };
    }

    if (employeeId) {
      query.employee = employeeId;
    }

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendance = await Attendance.find(query)
      .populate('employee', 'firstName lastName employeeCode avatar')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        attendance,
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

// @desc    Get attendance status (for check-in button state)
// @route   GET /api/attendance/status
// @access  Private
const getAttendanceStatus = async (req, res, next) => {
  try {
    const employeeId = req.user.employee._id || req.user.employee;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today
    });

    const employee = await Employee.findById(employeeId).select('isCheckedIn lastCheckIn');

    res.status(200).json({
      success: true,
      data: {
        isCheckedIn: employee.isCheckedIn,
        lastCheckIn: employee.lastCheckIn,
        todayRecord: attendance || null
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  getAttendanceStatus
};