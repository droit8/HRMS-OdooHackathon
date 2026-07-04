const { body, param, query } = require('express-validator');

const createTimeOffValidator = [
  body('employeeId')
    .optional()
    .isMongoId()
    .withMessage('Invalid employee ID format'),
  body('type')
    .notEmpty()
    .withMessage('Time-off type is required')
    .isIn(['vacation', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'unpaid', 'compensatory', 'other'])
    .withMessage('Invalid time-off type. Must be one of: vacation, sick, personal, maternity, paternity, bereavement, unpaid, compensatory, other'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid start date format. Use ISO 8601 format')
    .custom((value) => {
      const startDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Allow past dates only up to 7 days ago for retroactive requests
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (startDate < sevenDaysAgo) {
        throw new Error('Start date cannot be more than 7 days in the past');
      }
      return true;
    }),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('Invalid end date format. Use ISO 8601 format')
    .custom((value, { req }) => {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(value);
      if (endDate < startDate) {
        throw new Error('End date must be after or equal to start date');
      }
      // Limit request to 90 days max
      const maxDays = 90 * 24 * 60 * 60 * 1000;
      if (endDate - startDate > maxDays) {
        throw new Error('Time-off request cannot exceed 90 days');
      }
      return true;
    }),
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isString()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Reason must be between 5 and 1000 characters'),
  body('isHalfDay')
    .optional()
    .isBoolean()
    .withMessage('isHalfDay must be a boolean value'),
  body('halfDayPeriod')
    .optional()
    .isIn(['first-half', 'second-half'])
    .withMessage('halfDayPeriod must be either "first-half" or "second-half"')
    .custom((value, { req }) => {
      if (value && !req.body.isHalfDay) {
        throw new Error('halfDayPeriod can only be set when isHalfDay is true');
      }
      return true;
    }),
  body('attachments')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Attachments must be an array with a maximum of 5 items'),
  body('attachments.*')
    .optional()
    .isString()
    .withMessage('Each attachment must be a valid string (URL or file path)'),
  body('contactInfo')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Contact info must not exceed 200 characters'),
  body('delegateTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid delegate employee ID format'),
];

const updateTimeOffValidator = [
  param('id')
    .notEmpty()
    .withMessage('Time-off request ID is required')
    .isMongoId()
    .withMessage('Invalid time-off request ID format'),
  body('type')
    .optional()
    .isIn(['vacation', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'unpaid', 'compensatory', 'other'])
    .withMessage('Invalid time-off type'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format. Use ISO 8601 format'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format. Use ISO 8601 format')
    .custom((value, { req }) => {
      if (value && req.body.startDate) {
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(value);
        if (endDate < startDate) {
          throw new Error('End date must be after or equal to start date');
        }
      }
      return true;
    }),
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage('Reason must be between 5 and 1000 characters'),
  body('isHalfDay')
    .optional()
    .isBoolean()
    .withMessage('isHalfDay must be a boolean value'),
  body('halfDayPeriod')
    .optional()
    .isIn(['first-half', 'second-half'])
    .withMessage('halfDayPeriod must be either "first-half" or "second-half"'),
  body('contactInfo')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Contact info must not exceed 200 characters'),
  body('delegateTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid delegate employee ID format'),
];

const approveTimeOffValidator = [
  param('id')
    .notEmpty()
    .withMessage('Time-off request ID is required')
    .isMongoId()
    .withMessage('Invalid time-off request ID format'),
  body('comments')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comments must not exceed 500 characters'),
];

const rejectTimeOffValidator = [
  param('id')
    .notEmpty()
    .withMessage('Time-off request ID is required')
    .isMongoId()
    .withMessage('Invalid time-off request ID format'),
  body('rejectionReason')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Rejection reason must be between 5 and 500 characters'),
];

const cancelTimeOffValidator = [
  param('id')
    .notEmpty()
    .withMessage('Time-off request ID is required')
    .isMongoId()
    .withMessage('Invalid time-off request ID format'),
  body('cancellationReason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason must not exceed 500 characters'),
];

const getTimeOffValidator = [
  param('id')
    .notEmpty()
    .withMessage('Time-off request ID is required')
    .isMongoId()
    .withMessage('Invalid time-off request ID format'),
];

const getTimeOffListValidator = [
  query('employeeId')
    .optional()
    .isMongoId()
    .withMessage('Invalid employee ID format'),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'cancelled'])
    .withMessage('Invalid status filter. Must be one of: pending, approved, rejected, cancelled'),
  query('type')
    .optional()
    .isIn(['vacation', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'unpaid', 'compensatory', 'other'])
    .withMessage('Invalid type filter'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (value && req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(value);
        if (endDate < startDate) {
          throw new Error('End date must be after or equal to start date');
        }
      }
      return true;
    }),
  query('department')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Department must be between 1 and 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['startDate', 'endDate', 'createdAt', 'type', 'status'])
    .withMessage('Invalid sortBy field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be "asc" or "desc"'),
];

const deleteTimeOffValidator = [
  param('id')
    .notEmpty()
    .withMessage('Time-off request ID is required')
    .isMongoId()
    .withMessage('Invalid time-off request ID format'),
];

const getTimeOffBalanceValidator = [
  query('employeeId')
    .optional()
    .isMongoId()
    .withMessage('Invalid employee ID format'),
  query('year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100'),
];

const bulkApproveTimeOffValidator = [
  body('requestIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('requestIds must be an array with 1 to 50 entries'),
  body('requestIds.*')
    .isMongoId()
    .withMessage('Each request ID must be a valid MongoDB ID'),
  body('comments')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comments must not exceed 500 characters'),
];

const bulkRejectTimeOffValidator = [
  body('requestIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('requestIds must be an array with 1 to 50 entries'),
  body('requestIds.*')
    .isMongoId()
    .withMessage('Each request ID must be a valid MongoDB ID'),
  body('rejectionReason')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isString()
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Rejection reason must be between 5 and 500 characters'),
];

const getTeamCalendarValidator = [
  query('month')
    .notEmpty()
    .withMessage('Month is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  query('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be between 2000 and 2100'),
  query('department')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Department must be between 1 and 100 characters'),
  query('teamId')
    .optional()
    .isMongoId()
    .withMessage('Invalid team ID format'),
];

module.exports = {
  createTimeOffValidator,
  updateTimeOffValidator,
  approveTimeOffValidator,
  rejectTimeOffValidator,
  cancelTimeOffValidator,
  getTimeOffValidator,
  getTimeOffListValidator,
  deleteTimeOffValidator,
  getTimeOffBalanceValidator,
  bulkApproveTimeOffValidator,
  bulkRejectTimeOffValidator,
  getTeamCalendarValidator,
};