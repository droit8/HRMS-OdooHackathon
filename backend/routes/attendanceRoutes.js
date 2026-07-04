const express = require('express');
const router = express.Router();
const {
  checkIn, checkOut, getMyAttendance,
  getAllAttendance, getAttendanceStatus
} = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');
const { isAdminOrHR } = require('../middleware/rbac');

router.use(authenticate);

// Employee routes
router.post('/checkin', checkIn);
router.post('/checkout', checkOut);
router.get('/my', getMyAttendance);
router.get('/status', getAttendanceStatus);

// Admin/HR routes
router.get('/', isAdminOrHR, getAllAttendance);

module.exports = router;
