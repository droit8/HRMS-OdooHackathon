const { salaryComponents, deductions } = require('../config/config');

/**
 * Calculate salary components based on monthly wage
 */
const calculateSalaryComponents = (monthlyWage, customRates = {}) => {
  const basic = Math.round((monthlyWage * (customRates.basicPercent || 50)) / 100);
  const hra = Math.round((basic * (customRates.hraPercent || 60)) / 100);
  const standardAllowance = Math.round((monthlyWage * (customRates.standardPercent || 8.33)) / 100);
  const performanceBonus = Math.round((monthlyWage * (customRates.performancePercent || 8.33)) / 100);
  const lta = Math.round((monthlyWage * (customRates.ltaPercent || 8.33)) / 100);
  
  const totalComponents = basic + hra + standardAllowance + performanceBonus + lta;
  const fixedAllowance = Math.max(0, monthlyWage - totalComponents);
  
  const pfEmployee = Math.round((basic * (customRates.pfRate || deductions.PF_RATE)) / 100);
  const pfEmployer = Math.round((basic * (customRates.pfRate || deductions.PF_RATE)) / 100);
  const professionalTax = customRates.professionalTax || deductions.PROFESSIONAL_TAX;
  
  return {
    components: [
      {
        name: 'Basic Salary',
        type: 'percentage',
        percentageOf: 'wage',
        percentage: customRates.basicPercent || 50,
        amount: basic,
        description: 'Define Basic salary from company cost, compute is based on monthly wages.'
      },
      {
        name: 'House Rent Allowance',
        type: 'percentage',
        percentageOf: 'basic',
        percentage: customRates.hraPercent || 60,
        amount: hra,
        description: 'HRA provided: 60% of the basic salary'
      },
      {
        name: 'Standard Allowance',
        type: 'percentage',
        percentageOf: 'wage',
        percentage: customRates.standardPercent || 8.33,
        amount: standardAllowance,
        description: 'A standard allowance is a predetermined, fixed amount provided to employees as part of their salary'
      },
      {
        name: 'Performance Bonus',
        type: 'percentage',
        percentageOf: 'wage',
        percentage: customRates.performancePercent || 8.33,
        amount: performanceBonus,
        description: 'Included monthly and during payroll. The value defined by the company and calculated as a % of the basic salary'
      },
      {
        name: 'Leave Travel Allowance',
        type: 'percentage',
        percentageOf: 'wage',
        percentage: customRates.ltaPercent || 8.33,
        amount: lta,
        description: 'LTA is paid by the company to employees to cover their travel expenses, and calculated as a % of the basic salary'
      },
      {
        name: 'Fixed Allowance',
        type: 'remainder',
        percentageOf: '',
        percentage: 0,
        amount: fixedAllowance,
        description: 'Fixed allowance portion of wages is determined after subtracting all salary components'
      }
    ],
    pfEmployee: { rate: customRates.pfRate || 12, amount: pfEmployee },
    pfEmployer: { rate: customRates.pfRate || 12, amount: pfEmployer },
    professionalTax,
    grossSalary: monthlyWage,
    totalDeductions: pfEmployee + professionalTax,
    netSalary: monthlyWage - pfEmployee - professionalTax
  };
};

module.exports = { calculateSalaryComponents };