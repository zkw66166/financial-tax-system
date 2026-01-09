/**
 * 人事薪酬数据生成器
 */

const RandomHelper = require('../utils/randomHelper');

class HRDataGenerator {
    /**
     * 生成指定期间的人事薪酬数据
     */
    static generate(companyProfile, year, quarter) {
        const { id, baseline, growth } = companyProfile;

        // 计算员工数增长
        const yearsElapsed = year - 2022 + (quarter - 1) / 4;
        let employeeGrowthRate = Array.isArray(growth.yearlyRevenue)
            ? growth.yearlyRevenue[year - 2022] || 0.1
            : growth.yearlyRevenue;

        const totalEmployees = Math.round(
            baseline.employees * Math.pow(1 + employeeGrowthRate * 0.5, yearsElapsed)
        );

        // 薪资增长（通常低于收入增长）
        const avgSalary = Math.round(
            baseline.avgSalary * Math.pow(1.08, yearsElapsed) // 年薪资增长8%
        );

        // 部门配置
        const departments = this.getDepartments(companyProfile.industryCode);

        // 分配员工到各部门
        const hrData = [];
        let remainingEmployees = totalEmployees;

        departments.forEach((dept, index) => {
            const isLast = index === departments.length - 1;
            const employeeCount = isLast
                ? remainingEmployees
                : Math.round(totalEmployees * dept.ratio);

            remainingEmployees -= employeeCount;

            // 不同部门薪资差异
            const deptSalary = Math.round(avgSalary * dept.salaryMultiplier);

            hrData.push({
                company_id: id,
                period_year: year,
                period_month: quarter * 3,
                period_quarter: quarter,
                department: dept.name,
                employee_count: employeeCount,
                average_salary: deptSalary,
                social_insurance_base: Math.round(deptSalary * 0.8),
                housing_fund_base: Math.round(deptSalary * 0.8)
            });
        });

        return hrData;
    }

    /**
     * 根据行业获取部门配置
     */
    static getDepartments(industryCode) {
        // 软件行业
        if (industryCode === '3011' || industryCode === '3011.0') {
            return [
                { name: '研发部', ratio: 0.50, salaryMultiplier: 1.3 },
                { name: '销售部', ratio: 0.20, salaryMultiplier: 1.2 },
                { name: '市场部', ratio: 0.10, salaryMultiplier: 1.0 },
                { name: '行政部', ratio: 0.10, salaryMultiplier: 0.8 },
                { name: '财务部', ratio: 0.10, salaryMultiplier: 1.0 }
            ];
        }

        // 制造业
        if (industryCode === '3511') {
            return [
                { name: '生产部', ratio: 0.50, salaryMultiplier: 0.9 },
                { name: '技术部', ratio: 0.15, salaryMultiplier: 1.2 },
                { name: '销售部', ratio: 0.15, salaryMultiplier: 1.1 },
                { name: '质检部', ratio: 0.10, salaryMultiplier: 0.95 },
                { name: '行政部', ratio: 0.10, salaryMultiplier: 0.85 }
            ];
        }

        // 默认配置
        return [
            { name: '业务部', ratio: 0.40, salaryMultiplier: 1.1 },
            { name: '技术部', ratio: 0.30, salaryMultiplier: 1.2 },
            { name: '销售部', ratio: 0.15, salaryMultiplier: 1.0 },
            { name: '行政部', ratio: 0.10, salaryMultiplier: 0.9 },
            { name: '财务部', ratio: 0.05, salaryMultiplier: 1.0 }
        ];
    }

    /**
     * 批量生成多个期间的数据
     */
    static generateMultiple(companyProfile, periods) {
        const allHRData = [];

        periods.forEach(({ year, quarter }) => {
            const quarterlyHRData = this.generate(companyProfile, year, quarter);
            allHRData.push(...quarterlyHRData);
        });

        return allHRData;
    }
}

module.exports = HRDataGenerator;
