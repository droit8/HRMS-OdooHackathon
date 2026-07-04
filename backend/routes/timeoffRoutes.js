const express = require('express');
const router = express.Router();
const {
  applyLeave, getMyLeaves, getAllLeaves,
  updateLeaveStatus, getAllocations, updateAllocation
} = require('../controllers/timeoffController');
const { authenticate } = require('../middleware/auth');
const { isAdminOrHR } = require('../middleware/rbac');
const upload = require('../middleware/upload');

router.use(authenticate);

// Employee routes
router.post('/apply', upload.single('attachment'), applyLeave);
router.get('/my', getMyLeaves);
router.get('/allocations', getAllocations);

// Admin/HR routes
router.get('/', isAdminOrHR, getAllLeaves);
router.put('/:id/status', isAdminOrHR, updateLeaveStatus);
router.put('/allocations/:id', isAdminOrHR, updateAllocation);

module.exports = router;