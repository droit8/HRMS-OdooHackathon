const express = require('express');
const router = express.Router();
const {
  getMySalary, getEmployeeSalary, upsertSalary, getAllSalaries
} = require('../controllers/salaryController');
const { authenticate } = require('../middleware/auth');
const { authorize, isAdminOrHR } = require('../middleware/rbac');

router.use(authenticate);

// Admin only routes (Salary Info tab only visible to Admin per wireframe)
router.get('/', isAdminOrHR, getAllSalaries);
router.get('/my', getMySalary);
router.get('/:employeeId', isAdminOrHR, getEmployeeSalary);
router.post('/:employeeId', isAdminOrHR, upsertSalary);

module.exports = router;
