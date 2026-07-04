const { body, param, query } = require('express-validator');

const clockInValidator = [
  body('employeeId')
    .optional()
    .isMongoId()
    .withMessage('Invalid employee ID format'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format'),
  body('clockInTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid clock-in time format'),
  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  body('ipAddress')
    .optional()
    .isIP()
    .withMessage('Invalid IP address format'),
];

const clockOutValidator = [
  body('attendanceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid attendance ID format'),
  body('clockOutTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid clock-out time format'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
];

const createAttendanceValidator = [
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isMongoId()
    .withMessage('Invalid employee ID format'),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['present', 'absent', 'late', 'half-day', 'on-leave', 'holiday', 'weekend'])
    .withMessage('Invalid status. Must be one of: present, absent, late, half-day, on-leave, holiday, weekend'),
  body('clockInTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid clock-in time format'),
  body('clockOutTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid clock-out time format')
    .custom((value, { req }) => {
      if (value && req.body.clockInTime) {
        const clockIn = new Date(req.body.clockInTime);
        const clockOut = new Date(value);
        if (clockOut <= clockIn) {
          throw new Error('Clock-out time must be after clock-in time');
        }
      }
      return true;
    }),
  body('breakDuration')
    .optional()
    .isInt({ min: 0, max: 480 })
    .withMessage('Break duration must be between 0 and 480 minutes'),
  body('overtimeHours')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('Overtime hours must be between 0 and 24'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
];

const updateAttendanceValidator = [
  param('id')
    .notEmpty()
    .withMessage('Attendance ID is required')
    .isMongoId()
    .withMessage('Invalid attendance ID format'),
  body('status')
    .optional()
    .isIn(['present', 'absent', 'late', 'half-day', 'on-leave', 'holiday', 'weekend'])
    .withMessage('Invalid status. Must be one of: present, absent, late, half-day, on-leave, holiday, weekend'),
  body('clockInTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid clock-in time format'),
  body('clockOutTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid clock-out time format'),
  body('breakDuration')
    .optional()
    .isInt({ min: 0, max: 480 })
    .withMessage('Break duration must be between 0 and 480 minutes'),
  body('overtimeHours')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('Overtime hours must be between 0 and 24'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
];

const getAttendanceValidator = [
  param('id')
    .notEmpty()
    .withMessage('Attendance ID is required')
    .isMongoId()
    .withMessage('Invalid attendance ID format'),
];

const getAttendanceByDateRangeValidator = [
  query('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid start date format. Use ISO 8601 format'),
  query('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('Invalid end date format. Use ISO 8601 format')
    .custom((value, { req }) => {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(value);
      if (endDate < startDate) {
        throw new Error('End date must be after or equal to start date');
      }
      // Limit range to 1 year
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      if (endDate - startDate > oneYear) {
        throw new Error('Date range must not exceed 1 year');
      }
      return true;
    }),
  query('employeeId')
    .optional()
    .isMongoId()
    .withMessage('Invalid employee ID format'),
  query('department')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Department must be between 1 and 100 characters'),
  query('status')
    .optional()
    .isIn(['present', 'absent', 'late', 'half-day', 'on-leave', 'holiday', 'weekend'])
    .withMessage('Invalid status filter'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

const deleteAttendanceValidator = [
  param('id')
    .notEmpty()
    .withMessage('Attendance ID is required')
    .isMongoId()
    .withMessage('Invalid attendance ID format'),
];

const bulkAttendanceValidator = [
  body('attendances')
    .isArray({ min: 1, max: 100 })
    .withMessage('Attendances must be an array with 1 to 100 entries'),
  body('attendances.*.employeeId')
    .notEmpty()
    .withMessage('Employee ID is required for each attendance entry')
    .isMongoId()
    .withMessage('Invalid employee ID format'),
  body('attendances.*.date')
    .notEmpty()
    .withMessage('Date is required for each attendance entry')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('attendances.*.status')
    .notEmpty()
    .withMessage('Status is required for each attendance entry')
    .isIn(['present', 'absent', 'late', 'half-day', 'on-leave', 'holiday', 'weekend'])
    .withMessage('Invalid status'),
];

const getAttendanceSummaryValidator = [
  query('employeeId')
    .optional()
    .isMongoId()
    .withMessage('Invalid employee ID format'),
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  query('year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100'),
];

module.exports = {
  clockInValidator,
  clockOutValidator,
  createAttendanceValidator,
  updateAttendanceValidator,
  getAttendanceValidator,
  getAttendanceByDateRangeValidator,
  deleteAttendanceValidator,
  bulkAttendanceValidator,
  getAttendanceSummaryValidator,
};