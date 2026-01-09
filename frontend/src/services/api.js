const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
    async request(url, options = {}) {
        try {
            console.log(`API请求: ${options.method || 'GET'} ${API_BASE_URL}${url}`);

            const response = await fetch(`${API_BASE_URL}${url}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            console.log(`API响应状态: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API错误响应: ${errorText}`);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            console.log('API响应数据:', data);
            return data;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }

    // 企业相关接口
    async getCompanies() {
        return this.request('/companies');
    }

    async getCompanyById(id) {
        return this.request(`/companies/${id}`);
    }

    async createCompany(companyData) {
        return this.request('/companies', {
            method: 'POST',
            body: JSON.stringify(companyData),
        });
    }

    async deleteCompany(id) {
        return this.request(`/companies/${id}`, {
            method: 'DELETE',
        });
    }

    async deleteCompanies(companyIds) {
        return this.request('/companies/batch', {
            method: 'DELETE',
            body: JSON.stringify({ companyIds }),
        });
    }

    async getCompanyProfile(id) {
        return this.request(`/companies/${id}/profile`);
    }

    // 新增：获取可用的报告期
    async getAvailablePeriods(companyId) {
        return this.request(`/companies/${companyId}/periods`);
    }

    // 新增：根据报告期获取企业画像
    async getCompanyProfileByPeriod(companyId, period) {
        const periodParams = period ?
            `?period_year=${period.period_year}&period_month=${period.period_month || ''}&period_quarter=${period.period_quarter || ''}` : '';
        return this.request(`/companies/${companyId}/profile${periodParams}`);
    }

    // 新增：获取数据完整性状态
    async getDataStatus(companyId) {
        return this.request(`/companies/${companyId}/data-status`);
    }

    // 修改：批量上传多个文件 - 支持导入策略
    async uploadBatchFiles(companyId, files, strategy = 'append', onProgress = null) {
        const formData = new FormData();

        // 添加所有文件到FormData
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        // 添加导入策略
        formData.append('strategy', strategy);

        try {
            console.log(`批量上传文件: 企业ID ${companyId}, 文件数量: ${files.length}, 策略: ${strategy}`);

            // 记录文件信息
            files.forEach((file, index) => {
                console.log(`文件${index + 1}: ${file.name}, 大小: ${file.size} bytes`);
            });

            const response = await fetch(`${API_BASE_URL}/upload/batch/${companyId}`, {
                method: 'POST',
                body: formData,
            });

            console.log(`批量上传响应状态: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`批量上传错误响应: ${errorText}`);

                let errorMessage;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || `HTTP error! status: ${response.status}`;
                } catch {
                    errorMessage = `HTTP error! status: ${response.status}`;
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('批量上传成功响应:', data);
            return data;
        } catch (error) {
            console.error('批量文件上传错误:', error);
            throw error;
        }
    }

    // 文件上传接口 - 保持原有的单文件上传功能
    async uploadFile(endpoint, companyId, file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            console.log(`上传文件: ${endpoint}/${companyId}, 文件名: ${file.name}, 大小: ${file.size} bytes`);

            const response = await fetch(`${API_BASE_URL}/upload/${endpoint}/${companyId}`, {
                method: 'POST',
                body: formData,
            });

            console.log(`上传响应状态: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`上传错误响应: ${errorText}`);

                let errorMessage;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || `HTTP error! status: ${response.status}`;
                } catch {
                    errorMessage = `HTTP error! status: ${response.status}`;
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('上传成功响应:', data);
            return data;
        } catch (error) {
            console.error('文件上传错误:', error);
            throw error;
        }
    }

    // 各种数据上传 - 保持原有功能
    async uploadCompanyInfo(companyId, file) {
        return this.uploadFile('company-info', companyId, file);
    }

    async uploadBalanceSheet(companyId, file) {
        return this.uploadFile('balance-sheet', companyId, file);
    }

    async uploadIncomeStatement(companyId, file) {
        return this.uploadFile('income-statement', companyId, file);
    }

    async uploadTaxReports(companyId, file) {
        return this.uploadFile('tax-reports', companyId, file);
    }

    async uploadInvoiceData(companyId, file) {
        return this.uploadFile('invoice-data', companyId, file);
    }

    async uploadHRSalaryData(companyId, file) {
        return this.uploadFile('hr-salary', companyId, file);
    }

    async uploadAccountBalance(companyId, file) {
        return this.uploadFile('account-balance', companyId, file);
    }

    // Dashboard相关接口
    async getDashboardMetrics(companyId) {
        return this.request(`/dashboard/metrics/${companyId}`);
    }

    async getSystemStatus() {
        return this.request('/dashboard/system-status');
    }

    async getRecentActivities(companyId, limit = 10) {
        return this.request(`/dashboard/recent-activities/${companyId}?limit=${limit}`);
    }
}

export default new ApiService();