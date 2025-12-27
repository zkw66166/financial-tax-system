const XLSX = require('xlsx');

class ExcelParser {
    // 修复：更健壮的文件类型识别
    identifyFileType(buffer) {
        try {
            const workbook = XLSX.read(buffer);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];

            console.log('开始识别文件类型...');

            // 读取关键单元格进行判断
            const cellValues = {};
            const checkCells = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'B1', 'B2', 'B3', 'C1', 'D1', 'E1', 'F1', 'G1'];

            checkCells.forEach(cell => {
                cellValues[cell] = this.getCellValue(worksheet, cell);
                if (cellValues[cell]) {
                    console.log(`${cell}: ${cellValues[cell]}`);
                }
            });

            // 直接用原始文本进行比较，不做复杂的标准化

            // 科目余额表：A1="科目编码"，B1="科目名称"
            if (this.isAccountBalance(cellValues)) {
                console.log('识别为：科目余额表');
                return 'account-balance';
            }

            // 资产负债表：A3="资产负债表"，A4="资产"
            if (this.isBalanceSheet(cellValues)) {
                console.log('识别为：资产负债表');
                return 'balance-sheet';
            }

            // 利润表：A2="利润表"，A7="管理费用"
            if (this.isIncomeStatement(cellValues)) {
                console.log('识别为：利润表');
                return 'income-statement';
            }

            // 企业注册登记信息：A1="企业名称"，A2="统一社会信用代码"
            if (this.isCompanyInfo(cellValues)) {
                console.log('识别为：企业注册登记信息');
                return 'company-info';
            }

            // 纳税申报表：A1="税种"，A2="增值税"
            if (this.isTaxReports(cellValues)) {
                console.log('识别为：纳税申报表');
                return 'tax-reports';
            }

            // 发票数据：A1="发票类型"，A2="增值税专用发票"
            if (this.isInvoiceData(cellValues)) {
                console.log('识别为：发票数据');
                return 'invoice-data';
            }

            // 人事工资数据：A1="部门"，B1="人数"
            if (this.isHRSalaryData(cellValues)) {
                console.log('识别为：人事工资数据');
                return 'hr-salary';
            }

            console.log('无法识别文件类型，所有检查的单元格值：', cellValues);
            return null; // 无法识别
        } catch (error) {
            console.error('识别文件类型失败:', error);
            return null;
        }
    }

    // 简化的文本检查函数 - 直接包含检查，不做复杂标准化
    containsText(text, keyword) {
        if (!text || !keyword) return false;
        const textStr = text.toString().trim();
        return textStr.includes(keyword);
    }

    // 检查是否为科目余额表
    isAccountBalance(cellValues) {
        console.log('检查科目余额表特征:');

        const a1Check = this.containsText(cellValues.A1, '科目编码');
        const b1Check = this.containsText(cellValues.B1, '科目名称');

        console.log(`- A1包含"科目编码": ${a1Check} (实际值: "${cellValues.A1}")`);
        console.log(`- B1包含"科目名称": ${b1Check} (实际值: "${cellValues.B1}")`);

        // 主要特征：A1包含"科目编码"且B1包含"科目名称"
        if (a1Check && b1Check) {
            return true;
        }

        // 备用检查：科目相关的其他组合
        const altA1 = this.containsText(cellValues.A1, '会计科目') || this.containsText(cellValues.A1, '科目代码');
        const altB1 = this.containsText(cellValues.B1, '会计科目名称') || this.containsText(cellValues.B2, '科目名称');

        if (altA1 && altB1) {
            return true;
        }

        return false;
    }

    // 检查是否为资产负债表
    isBalanceSheet(cellValues) {
        console.log('检查资产负债表特征:');

        const a3Check = this.containsText(cellValues.A3, '资产负债表');
        const a4Check = this.containsText(cellValues.A4, '资产');

        console.log(`- A3包含"资产负债表": ${a3Check} (实际值: "${cellValues.A3}")`);
        console.log(`- A4包含"资产": ${a4Check} (实际值: "${cellValues.A4}")`);

        // 主要特征：A3包含"资产负债表"且A4包含"资产"
        if (a3Check && a4Check) {
            return true;
        }

        // 备用检查：其他位置的资产负债表
        const altCheck1 = this.containsText(cellValues.A1, '资产负债表') || this.containsText(cellValues.A2, '资产负债表');
        const altCheck2 = this.containsText(cellValues.A4, '资产') || this.containsText(cellValues.A5, '资产');

        if (altCheck1 && altCheck2) {
            return true;
        }

        return false;
    }

    // 检查是否为利润表
    isIncomeStatement(cellValues) {
        console.log('检查利润表特征:');

        const a2Check = this.containsText(cellValues.A2, '利润表');
        const a7Check = this.containsText(cellValues.A7, '管理费用');

        console.log(`- A2包含"利润表": ${a2Check} (实际值: "${cellValues.A2}")`);
        console.log(`- A7包含"管理费用": ${a7Check} (实际值: "${cellValues.A7}")`);

        // 主要特征：A2包含"利润表"且A7包含"管理费用"
        if (a2Check && a7Check) {
            return true;
        }

        // 备用检查：其他利润表特征
        const altCheck1 = this.containsText(cellValues.A1, '利润表') || this.containsText(cellValues.A3, '利润表');
        const altCheck2 = this.containsText(cellValues.A6, '管理费用') || this.containsText(cellValues.A7, '管理费用');

        if (altCheck1 && altCheck2) {
            return true;
        }

        // 通过营业收入和营业成本组合判断
        const revenueCheck = this.containsText(cellValues.A3, '营业收入');
        const costCheck = this.containsText(cellValues.A4, '营业成本');

        if (a2Check && (revenueCheck || costCheck)) {
            return true;
        }

        return false;
    }

    // 检查是否为企业注册登记信息
    isCompanyInfo(cellValues) {
        console.log('检查企业信息特征:');

        const a1Check = this.containsText(cellValues.A1, '企业名称');
        const a2Check = this.containsText(cellValues.A2, '统一社会信用代码');

        console.log(`- A1包含"企业名称": ${a1Check} (实际值: "${cellValues.A1}")`);
        console.log(`- A2包含"统一社会信用代码": ${a2Check} (实际值: "${cellValues.A2}")`);

        // 主要特征：A1包含"企业名称"且A2包含"统一社会信用代码"
        if (a1Check && a2Check) {
            return true;
        }

        // 备用检查：公司名称和税号
        const altA1 = this.containsText(cellValues.A1, '公司名称');
        const altA2 = this.containsText(cellValues.A2, '税号') || this.containsText(cellValues.A2, '纳税人识别号');

        if (altA1 && altA2) {
            return true;
        }

        return false;
    }

    // 检查是否为纳税申报表
    isTaxReports(cellValues) {
        console.log('检查纳税申报表特征:');

        const a1Check = this.containsText(cellValues.A1, '税种');
        const a2Check = this.containsText(cellValues.A2, '增值税');

        console.log(`- A1包含"税种": ${a1Check} (实际值: "${cellValues.A1}")`);
        console.log(`- A2包含"增值税": ${a2Check} (实际值: "${cellValues.A2}")`);

        // 主要特征：A1包含"税种"且A2包含"增值税"
        if (a1Check && a2Check) {
            return true;
        }

        // 备用检查：税种和企业所得税
        const altA2 = this.containsText(cellValues.A3, '企业所得税');

        if (a1Check && altA2) {
            return true;
        }

        return false;
    }

    // 检查是否为发票数据
    isInvoiceData(cellValues) {
        console.log('检查发票数据特征:');

        const a1Check = this.containsText(cellValues.A1, '发票类型');
        const a2Check = this.containsText(cellValues.A2, '增值税专用发票');

        console.log(`- A1包含"发票类型": ${a1Check} (实际值: "${cellValues.A1}")`);
        console.log(`- A2包含"增值税专用发票": ${a2Check} (实际值: "${cellValues.A2}")`);

        // 主要特征：A1包含"发票类型"且A2包含"增值税专用发票"
        if (a1Check && a2Check) {
            return true;
        }

        // 备用检查：发票相关的其他组合
        const altCheck = this.containsText(cellValues.A1, '发票') &&
            (this.containsText(cellValues.A2, '专用') || this.containsText(cellValues.A3, '普通'));

        if (altCheck) {
            return true;
        }

        return false;
    }

    // 检查是否为人事工资数据
    isHRSalaryData(cellValues) {
        console.log('检查人事工资数据特征:');

        const a1Check = this.containsText(cellValues.A1, '部门');
        const b1Check = this.containsText(cellValues.B1, '人数');

        console.log(`- A1包含"部门": ${a1Check} (实际值: "${cellValues.A1}")`);
        console.log(`- B1包含"人数": ${b1Check} (实际值: "${cellValues.B1}")`);

        // 主要特征：A1包含"部门"且B1包含"人数"
        if (a1Check && b1Check) {
            return true;
        }

        // 备用检查：部门和员工/薪资相关
        const altCheck = this.containsText(cellValues.A1, '部门') &&
            (this.containsText(cellValues.B1, '员工') ||
                this.containsText(cellValues.C1, '薪资') ||
                this.containsText(cellValues.C1, '工资'));

        if (altCheck) {
            return true;
        }

        return false;
    }

    // 获取文件类型的中文名称
    getFileTypeName(fileType) {
        const typeNames = {
            'company-info': '企业注册登记信息',
            'balance-sheet': '资产负债表',
            'income-statement': '利润表',
            'tax-reports': '纳税申报表',
            'invoice-data': '发票数据',
            'hr-salary': '人事工资数据',
            'account-balance': '科目余额表'
        };
        return typeNames[fileType] || '未知类型';
    }

    // excelParser.js 中的 parseCompanyInfo 方法修改

    parseCompanyInfo(buffer) {
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        // 辅助函数：处理日期数据
        const formatDate = (cellValue) => {
            if (!cellValue) return '';

            // 如果是数字（Excel日期序列号）
            if (typeof cellValue === 'number') {
                try {
                    // Excel日期转换：Excel日期从1900年1月1日开始计算
                    const excelDate = new Date((cellValue - 25569) * 86400 * 1000);
                    if (excelDate.getFullYear() >= 1900 && excelDate.getFullYear() <= 2100) {
                        return excelDate.toISOString().split('T')[0]; // 返回 YYYY-MM-DD 格式
                    }
                } catch (error) {
                    console.log('Excel日期转换失败:', error.message);
                }
            }

            // 如果是字符串日期
            if (typeof cellValue === 'string') {
                const dateStr = cellValue.toString().trim();

                // 尝试各种日期格式
                const dateFormats = [
                    /(\d{4})-(\d{1,2})-(\d{1,2})/,     // YYYY-MM-DD
                    /(\d{4})\/(\d{1,2})\/(\d{1,2})/,   // YYYY/MM/DD
                    /(\d{4})年(\d{1,2})月(\d{1,2})日/, // YYYY年MM月DD日
                    /(\d{4})\.(\d{1,2})\.(\d{1,2})/    // YYYY.MM.DD
                ];

                for (const format of dateFormats) {
                    const match = dateStr.match(format);
                    if (match) {
                        const year = parseInt(match[1]);
                        const month = parseInt(match[2]);
                        const day = parseInt(match[3]);

                        if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                            return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                        }
                    }
                }

                // 尝试直接解析为Date对象
                try {
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
                        return date.toISOString().split('T')[0];
                    }
                } catch (error) {
                    console.log('字符串日期解析失败:', error.message);
                }
            }

            // 如果是Date对象
            if (cellValue instanceof Date) {
                if (!isNaN(cellValue.getTime()) && cellValue.getFullYear() >= 1900 && cellValue.getFullYear() <= 2100) {
                    return cellValue.toISOString().split('T')[0];
                }
            }

            // 默认返回原值的字符串形式
            return cellValue.toString();
        };

        // 辅助函数：处理行业代码（确保是字符串）
        const formatIndustryCode = (cellValue) => {
            if (!cellValue) return '';

            // 如果是数字，转换为字符串并保持原始格式
            if (typeof cellValue === 'number') {
                return cellValue.toString();
            }

            return cellValue.toString().trim();
        };

        // 辅助函数：处理数值数据
        const formatNumber = (cellValue) => {
            if (!cellValue) return 0;

            const num = parseFloat(cellValue);
            return isNaN(num) ? 0 : num;
        };

        // 辅助函数：处理文本数据
        const formatText = (cellValue) => {
            if (!cellValue) return '';
            return cellValue.toString().trim();
        };

        console.log('解析企业基本信息...');
        console.log('原始成立日期值:', this.getCellValue(worksheet, 'B6'), '类型:', typeof this.getCellValue(worksheet, 'B6'));
        console.log('原始行业代码值:', this.getCellValue(worksheet, 'B11'), '类型:', typeof this.getCellValue(worksheet, 'B11'));

        const companyInfo = {
            name: formatText(this.getCellValue(worksheet, 'B1')),
            tax_code: formatText(this.getCellValue(worksheet, 'B2')),
            company_type: formatText(this.getCellValue(worksheet, 'B3')),
            legal_person: formatText(this.getCellValue(worksheet, 'B4')),
            registered_capital: formatNumber(this.getCellValue(worksheet, 'B5')),
            establishment_date: formatDate(this.getCellValue(worksheet, 'B6')),
            business_term: formatText(this.getCellValue(worksheet, 'B7')),
            address: formatText(this.getCellValue(worksheet, 'B8')),
            business_scope: formatText(this.getCellValue(worksheet, 'B9')),
            industry: formatText(this.getCellValue(worksheet, 'B10')),
            industry_code: formatIndustryCode(this.getCellValue(worksheet, 'B11')),
            company_scale: formatText(this.getCellValue(worksheet, 'B12')),
            employee_count: parseInt(formatNumber(this.getCellValue(worksheet, 'B13'))),
            shareholder_info: formatText(this.getCellValue(worksheet, 'B14'))
        };

        console.log('解析后的企业信息:');
        console.log('- 成立日期:', companyInfo.establishment_date);
        console.log('- 行业代码:', companyInfo.industry_code);
        console.log('- 注册资本:', companyInfo.registered_capital);
        console.log('- 员工人数:', companyInfo.employee_count);

        return companyInfo;
    }

    parseBalanceSheet(buffer) {
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        // 解析期间信息 - 明确从B1获取
        const periodInfo = this.parsePeriodInfo(this.getCellValue(worksheet, 'B1'));

        console.log('资产负债表期间信息解析:', {
            rawB1: this.getCellValue(worksheet, 'B1'),
            parsedPeriodInfo: periodInfo
        });

        return {
            ...periodInfo,
            period_end_date: this.getCellValue(worksheet, 'B2') || new Date().toISOString().split('T')[0],
            cash_and_equivalents: parseFloat(this.getCellValue(worksheet, 'B4')) || 0,
            trading_financial_assets: parseFloat(this.getCellValue(worksheet, 'B5')) || 0,
            accounts_receivable: parseFloat(this.getCellValue(worksheet, 'B6')) || 0,
            prepayments: parseFloat(this.getCellValue(worksheet, 'B7')) || 0,
            other_receivables: parseFloat(this.getCellValue(worksheet, 'B8')) || 0,
            inventory: parseFloat(this.getCellValue(worksheet, 'B9')) || 0,
            current_assets_total: parseFloat(this.getCellValue(worksheet, 'B10')) || 0,
            long_term_equity_investment: parseFloat(this.getCellValue(worksheet, 'B12')) || 0,
            fixed_assets: parseFloat(this.getCellValue(worksheet, 'B13')) || 0,
            accumulated_depreciation: parseFloat(this.getCellValue(worksheet, 'B14')) || 0,
            intangible_assets: parseFloat(this.getCellValue(worksheet, 'B15')) || 0,
            accumulated_amortization: parseFloat(this.getCellValue(worksheet, 'B16')) || 0,
            non_current_assets_total: parseFloat(this.getCellValue(worksheet, 'B17')) || 0,
            total_assets: parseFloat(this.getCellValue(worksheet, 'B18')) || 0,
            short_term_loans: parseFloat(this.getCellValue(worksheet, 'B21')) || 0,
            accounts_payable: parseFloat(this.getCellValue(worksheet, 'B22')) || 0,
            employee_benefits_payable: parseFloat(this.getCellValue(worksheet, 'B23')) || 0,
            taxes_payable: parseFloat(this.getCellValue(worksheet, 'B24')) || 0,
            current_liabilities_total: parseFloat(this.getCellValue(worksheet, 'B25')) || 0,
            long_term_loans: parseFloat(this.getCellValue(worksheet, 'B27')) || 0,
            non_current_liabilities_total: parseFloat(this.getCellValue(worksheet, 'B28')) || 0,
            total_liabilities: parseFloat(this.getCellValue(worksheet, 'B29')) || 0,
            paid_in_capital: parseFloat(this.getCellValue(worksheet, 'B31')) || 0,
            capital_surplus: parseFloat(this.getCellValue(worksheet, 'B32')) || 0,
            surplus_reserves: parseFloat(this.getCellValue(worksheet, 'B33')) || 0,
            retained_earnings: parseFloat(this.getCellValue(worksheet, 'B34')) || 0,
            total_equity: parseFloat(this.getCellValue(worksheet, 'B35')) || 0
        };
    }

    // 修复：利润表解析 - 明确从B1获取期间信息
    parseIncomeStatement(buffer) {
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        // 明确从B1获取期间信息（A1是"报告期间"标签，B1是具体日期）
        const rawPeriodValue = this.getCellValue(worksheet, 'B1');
        const periodInfo = this.parsePeriodInfo(rawPeriodValue);

        console.log('利润表期间信息解析:', {
            A1_label: this.getCellValue(worksheet, 'A1'),
            B1_rawValue: rawPeriodValue,
            parsedPeriodInfo: periodInfo
        });

        const incomeData = {
            ...periodInfo,
            period: rawPeriodValue || `${periodInfo.period_year}年${periodInfo.period_month}月`,
            operating_revenue: parseFloat(this.getCellValue(worksheet, 'B3')) || 0,
            operating_costs: parseFloat(this.getCellValue(worksheet, 'B4')) || 0,
            taxes_and_surcharges: parseFloat(this.getCellValue(worksheet, 'B5')) || 0,
            selling_expenses: parseFloat(this.getCellValue(worksheet, 'B6')) || 0,
            administrative_expenses: parseFloat(this.getCellValue(worksheet, 'B7')) || 0,
            financial_expenses: parseFloat(this.getCellValue(worksheet, 'B8')) || 0,
            operating_profit: parseFloat(this.getCellValue(worksheet, 'B9')) || 0,
            non_operating_income: parseFloat(this.getCellValue(worksheet, 'B10')) || 0,
            non_operating_expenses: parseFloat(this.getCellValue(worksheet, 'B11')) || 0,
            total_profit: parseFloat(this.getCellValue(worksheet, 'B12')) || 0,
            income_tax_expense: parseFloat(this.getCellValue(worksheet, 'B13')) || 0,
            net_profit: parseFloat(this.getCellValue(worksheet, 'B14')) || 0
        };

        console.log('利润表解析结果:', incomeData);
        return incomeData;
    }

    // 修复：税务申报解析 - 确保正确解析期间信息
    parseTaxReports(buffer) {
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const reports = [];

        // 从第2行开始读取数据
        let row = 2;
        while (this.getCellValue(worksheet, `A${row}`)) {
            // 确保从B列正确获取期间信息
            const rawPeriod = this.getCellValue(worksheet, `B${row}`);
            const periodInfo = this.parsePeriodInfo(rawPeriod);

            console.log(`税务申报第${row}行期间解析:`, {
                raw: rawPeriod,
                parsed: periodInfo
            });

            reports.push({
                ...periodInfo,
                tax_type: this.getCellValue(worksheet, `A${row}`),
                period: rawPeriod || `${periodInfo.period_year}年${periodInfo.period_month}月`,
                taxable_amount: parseFloat(this.getCellValue(worksheet, `C${row}`)) || 0,
                paid_amount: parseFloat(this.getCellValue(worksheet, `D${row}`)) || 0,
                refund_amount: parseFloat(this.getCellValue(worksheet, `E${row}`)) || 0,
                tax_rate: parseFloat(this.getCellValue(worksheet, `F${row}`)) || 0
            });
            row++;
        }

        return reports;
    }

    // 修复：发票数据解析 - 添加期间信息支持
    parseInvoiceData(buffer) {
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const invoices = [];

        // 从第2行开始读取数据
        let row = 2;
        let periodInfo = null;

        // 首先尝试从F1或G1获取统一的期间信息
        const headerPeriod = this.getCellValue(worksheet, 'F1') || this.getCellValue(worksheet, 'G1');
        if (headerPeriod) {
            periodInfo = this.parsePeriodInfo(headerPeriod);
            console.log('发票数据使用表头期间信息:', periodInfo);
        }

        while (this.getCellValue(worksheet, `A${row}`)) {
            // 如果每行都有期间信息（F列），则使用行级期间信息
            const rowPeriod = this.getCellValue(worksheet, `F${row}`);
            let currentPeriodInfo = periodInfo;

            if (rowPeriod) {
                currentPeriodInfo = this.parsePeriodInfo(rowPeriod);
                console.log(`发票数据第${row}行期间信息:`, currentPeriodInfo);
            } else if (!periodInfo) {
                // 如果没有期间信息，使用默认值
                currentPeriodInfo = this.parsePeriodInfo(null);
            }

            invoices.push({
                ...currentPeriodInfo,
                invoice_type: this.getCellValue(worksheet, `A${row}`),
                invoice_amount: parseFloat(this.getCellValue(worksheet, `B${row}`)) || 0,
                tax_amount: parseFloat(this.getCellValue(worksheet, `C${row}`)) || 0,
                invoice_count: parseInt(this.getCellValue(worksheet, `D${row}`)) || 0,
                average_amount: parseFloat(this.getCellValue(worksheet, `E${row}`)) || 0
            });
            row++;
        }

        return invoices;
    }

    // 修复：人事薪酬解析 - 添加期间信息支持
    parseHRSalaryData(buffer) {
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const hrData = [];

        // 从第2行开始读取数据
        let row = 2;
        let periodInfo = null;

        // 首先尝试从F1或G1获取统一的期间信息
        const headerPeriod = this.getCellValue(worksheet, 'F1') || this.getCellValue(worksheet, 'G1');
        if (headerPeriod) {
            periodInfo = this.parsePeriodInfo(headerPeriod);
            console.log('人事薪酬数据使用表头期间信息:', periodInfo);
        }

        while (this.getCellValue(worksheet, `A${row}`)) {
            // 如果每行都有期间信息（F列），则使用行级期间信息
            const rowPeriod = this.getCellValue(worksheet, `F${row}`);
            let currentPeriodInfo = periodInfo;

            if (rowPeriod) {
                currentPeriodInfo = this.parsePeriodInfo(rowPeriod);
                console.log(`人事薪酬第${row}行期间信息:`, currentPeriodInfo);
            } else if (!periodInfo) {
                // 如果没有期间信息，使用默认值
                currentPeriodInfo = this.parsePeriodInfo(null);
            }

            hrData.push({
                ...currentPeriodInfo,
                department: this.getCellValue(worksheet, `A${row}`),
                employee_count: parseInt(this.getCellValue(worksheet, `B${row}`)) || 0,
                average_salary: parseFloat(this.getCellValue(worksheet, `C${row}`)) || 0,
                social_insurance_base: parseFloat(this.getCellValue(worksheet, `D${row}`)) || 0,
                housing_fund_base: parseFloat(this.getCellValue(worksheet, `E${row}`)) || 0
            });
            row++;
        }

        return hrData;
    }

    // 修复：科目余额解析 - 添加期间信息支持
    parseAccountBalance(buffer) {
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const accounts = [];

        // 从第2行开始读取数据
        let row = 2;
        let periodInfo = null;

        // 首先尝试从G1获取统一的期间信息
        const headerPeriod = this.getCellValue(worksheet, 'G1');
        if (headerPeriod) {
            periodInfo = this.parsePeriodInfo(headerPeriod);
            console.log('科目余额表使用表头期间信息:', periodInfo);
        }

        while (this.getCellValue(worksheet, `A${row}`)) {
            // 如果每行都有期间信息（G列），则使用行级期间信息
            const rowPeriod = this.getCellValue(worksheet, `G${row}`);
            let currentPeriodInfo = periodInfo;

            if (rowPeriod) {
                currentPeriodInfo = this.parsePeriodInfo(rowPeriod);
                console.log(`科目余额第${row}行期间信息:`, currentPeriodInfo);
            } else if (!periodInfo) {
                // 如果没有期间信息，使用默认值
                currentPeriodInfo = this.parsePeriodInfo(null);
            }

            accounts.push({
                ...currentPeriodInfo,
                account_code: this.getCellValue(worksheet, `A${row}`),
                account_name: this.getCellValue(worksheet, `B${row}`),
                opening_balance: parseFloat(this.getCellValue(worksheet, `C${row}`)) || 0,
                debit_amount: parseFloat(this.getCellValue(worksheet, `D${row}`)) || 0,
                credit_amount: parseFloat(this.getCellValue(worksheet, `E${row}`)) || 0,
                ending_balance: parseFloat(this.getCellValue(worksheet, `F${row}`)) || 0
            });
            row++;
        }

        return accounts;
    }

    // 增强：解析期间信息的辅助方法
    // 修复期间解析方法，避免错误的Excel日期序列号解析
    parsePeriodInfo(periodString) {
        console.log('解析期间信息输入:', periodString);

        if (!periodString) {
            const currentDate = new Date();
            const defaultPeriod = {
                period_year: currentDate.getFullYear(),
                period_month: currentDate.getMonth() + 1,
                period_quarter: Math.ceil((currentDate.getMonth() + 1) / 3)
            };
            console.log('使用默认期间:', defaultPeriod);
            return defaultPeriod;
        }

        // 处理各种期间格式
        const str = periodString.toString().trim();
        console.log('期间字符串处理:', str);

        // 格式：2024年12月 或 2024-12 或 2024/12
        let match = str.match(/(\d{4})[年\-\/]?(\d{1,2})/);
        if (match) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]);

            // 验证年份范围，避免异常值
            if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12) {
                const result = {
                    period_year: year,
                    period_month: month,
                    period_quarter: Math.ceil(month / 3)
                };
                console.log('匹配年月格式:', result);
                return result;
            }
        }

        // 格式：2024年第4季度
        match = str.match(/(\d{4})[年].*[第](\d)[季度]/);
        if (match) {
            const year = parseInt(match[1]);
            const quarter = parseInt(match[2]);

            if (year >= 1900 && year <= 2100 && quarter >= 1 && quarter <= 4) {
                const result = {
                    period_year: year,
                    period_month: quarter * 3,
                    period_quarter: quarter
                };
                console.log('匹配季度格式:', result);
                return result;
            }
        }

        // 格式：2023-12-1 或 2023/12/1 或 2024-12-01 00:00:00
        match = str.match(/(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})/);
        if (match) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]);

            if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12) {
                const result = {
                    period_year: year,
                    period_month: month,
                    period_quarter: Math.ceil(month / 3)
                };
                console.log('匹配完整日期格式:', result);
                return result;
            }
        }

        // 格式：2024年
        match = str.match(/(\d{4})[年]?$/);
        if (match) {
            const year = parseInt(match[1]);

            if (year >= 1900 && year <= 2100) {
                const result = {
                    period_year: year,
                    period_month: 12,
                    period_quarter: 4
                };
                console.log('匹配年份格式:', result);
                return result;
            }
        }

        // 修复：Excel日期序列号处理 - 添加更严格的验证
        if (/^\d+$/.test(str)) {
            const numValue = parseInt(str);
            // 只处理合理范围内的Excel序列号（1900-2100年对应的序列号）
            if (numValue >= 1 && numValue <= 73050) { // 大约对应1900-2100年
                try {
                    const excelDate = new Date((numValue - 25569) * 86400 * 1000);
                    if (excelDate.getFullYear() >= 1900 && excelDate.getFullYear() <= 2100) {
                        const result = {
                            period_year: excelDate.getFullYear(),
                            period_month: excelDate.getMonth() + 1,
                            period_quarter: Math.ceil((excelDate.getMonth() + 1) / 3)
                        };
                        console.log('匹配Excel日期序列号:', result);
                        return result;
                    }
                } catch (error) {
                    console.log('Excel日期序列号转换失败:', error.message);
                }
            } else {
                console.log('Excel序列号超出合理范围，跳过:', numValue);
            }
        }

        // 尝试直接解析为日期对象
        try {
            const dateObj = new Date(str);
            if (!isNaN(dateObj.getTime()) && dateObj.getFullYear() >= 1900 && dateObj.getFullYear() <= 2100) {
                const result = {
                    period_year: dateObj.getFullYear(),
                    period_month: dateObj.getMonth() + 1,
                    period_quarter: Math.ceil((dateObj.getMonth() + 1) / 3)
                };
                console.log('匹配Date对象解析:', result);
                return result;
            }
        } catch (error) {
            console.log('Date对象解析失败:', error.message);
        }

        // 默认值
        const currentDate = new Date();
        const defaultResult = {
            period_year: currentDate.getFullYear(),
            period_month: currentDate.getMonth() + 1,
            period_quarter: Math.ceil((currentDate.getMonth() + 1) / 3)
        };
        console.log('使用默认期间值:', defaultResult);
        return defaultResult;
    }

    // 修改 getCellValue 方法，保持数据类型的完整性
    getCellValue(worksheet, cellAddress) {
        const cell = worksheet[cellAddress];
        if (!cell) return '';

        // 处理不同类型的单元格值，保持原始数据类型
        if (cell.t === 'd') {
            // 日期类型 - 返回Date对象
            return cell.v;
        } else if (cell.t === 'n') {
            // 数字类型 - 保持数字格式
            return cell.v;
        } else if (cell.t === 's') {
            // 字符串类型
            return cell.v;
        } else if (cell.t === 'b') {
            // 布尔类型
            return cell.v;
        } else {
            // 其他类型，返回值或空字符串
            return cell.v || '';
        }
    }
}

module.exports = new ExcelParser();