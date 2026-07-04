const mongoose = require('mongoose');

const salaryComponentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['percentage', 'fixed', 'remainder'], required: true },
  percentageOf: { type: String, enum: ['wage', 'basic', ''], default: '' },
  percentage: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  description: String
});

const salarySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    unique: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  wageType: {
    type: String,
    enum: ['fixed'],
    default: 'fixed'
  },
  monthlyWage: {
    type: Number,
    required: [true, 'Monthly wage is required'],
    min: 0
  },
  yearlyWage: {
    type: Number,
    default: 0
  },
  workingDaysPerWeek: {
    type: Number,
    default: 5
  },
  breakTimeHours: {
    type: Number,
    default: 1
  },
  components: [salaryComponentSchema],
  
  // Deductions
  pfEmployee: {
    rate: { type: Number, default: 12 },
    amount: { type: Number, default: 0 }
  },
  pfEmployer: {
    rate: { type: Number, default: 12 },
    amount: { type: Number, default: 0 }
  },
  professionalTax: {
    type: Number,
    default: 200
  },
  
  // Net calculations
  grossSalary: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Auto-calculate yearly wage and components
salarySchema.pre('save', function(next) {
  this.yearlyWage = this.monthlyWage * 12;
  
  // Calculate components
  let basicAmount = 0;
  let totalComponentAmount = 0;
  
  this.components.forEach(component => {
    if (component.name === 'Basic Salary') {
      component.amount = Math.round((this.monthlyWage * component.percentage) / 100);
      basicAmount = component.amount;
    }
  });
  
  this.components.forEach(component => {
    if (component.name === 'House Rent Allowance') {
      component.amount = Math.round((basicAmount * component.percentage) / 100);
    } else if (component.type === 'percentage' && component.percentageOf === 'wage' && component.name !== 'Basic Salary') {
      component.amount = Math.round((this.monthlyWage * component.percentage) / 100);
    }
  });
  
  // Calculate fixed allowance (remainder)
  totalComponentAmount = this.components
    .filter(c => c.type !== 'remainder')
    .reduce((sum, c) => sum + c.amount, 0);
  
  const fixedAllowance = this.components.find(c => c.type === 'remainder');
  if (fixedAllowance) {
    fixedAllowance.amount = Math.max(0, this.monthlyWage - totalComponentAmount);
  }
  
  // Calculate PF
  this.pfEmployee.amount = Math.round((basicAmount * this.pfEmployee.rate) / 100);
  this.pfEmployer.amount = Math.round((basicAmount * this.pfEmployer.rate) / 100);
  
  // Calculate totals
  this.grossSalary = this.monthlyWage;
  this.totalDeductions = this.pfEmployee.amount + this.professionalTax;
  this.netSalary = this.grossSalary - this.totalDeductions;
  
  next();
});

module.exports = mongoose.model('Salary', salarySchema);