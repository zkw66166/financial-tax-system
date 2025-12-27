import React, { useState, useEffect } from 'react';
import { Database, Upload, Download, CheckCircle, AlertTriangle, FileText, Building, Users, Trash2, X, FileStack, RefreshCw, Info, Calendar, BarChart3 } from 'lucide-react';
import ApiService from '../../services/api';

const DataManagement = ({ currentUser, selectedCompany }) => {
    const [companies, setCompanies] = useState([]);
    const [currentCompanyId, setCurrentCompanyId] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({});
    const [uploadResults, setUploadResults] = useState({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCompanies, setSelectedCompanies] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // 批量上传相关状态
    const [batchUploading, setBatchUploading] = useState(false);
    const [batchProgress, setBatchProgress] = useState(0);
    const [batchResults, setBatchResults] = useState(null);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [currentProcessingFile, setCurrentProcessingFile] = useState('');

    // 数据导入策略配置
    const [importStrategy, setImportStrategy] = useState('skip');
    const [showStrategyModal, setShowStrategyModal] = useState(false);
    const [pendingFiles, setPendingFiles] = useState([]);

    // 新增：数据完整性状态
    const [dataStatus, setDataStatus] = useState(null);
    const [loadingDataStatus, setLoadingDataStatus] = useState(false);

    useEffect(() => {
        loadCompanies();
    }, []);

    useEffect(() => {
        if (selectedCompany) {
            findCurrentCompanyId();
        }
    }, [selectedCompany, companies]);

    useEffect(() => {
        if (currentCompanyId) {
            loadDataStatus();
        }
    }, [currentCompanyId]);

    const loadCompanies = async () => {
        try {
            const response = await ApiService.getCompanies();
            if (response.success) {
                setCompanies(response.data);
                // 移除对 setSelectedCompany 的调用，因为它不在 props 中
            }
        } catch (error) {
            console.error('加载企业列表失败:', error);
        }
    };

    const findCurrentCompanyId = () => {
        if (typeof selectedCompany === 'object' && selectedCompany.id) {
            setCurrentCompanyId(selectedCompany.id);
        } else {
            const company = companies.find(c => c.name === selectedCompany);
            if (company) {
                setCurrentCompanyId(company.id);
            } else {
                console.log('未找到企业:', selectedCompany, '可用企业:', companies.map(c => c.name));
            }
        }
    };

    // 新增：加载数据完整性状态
    const loadDataStatus = async () => {
        try {
            setLoadingDataStatus(true);
            const response = await ApiService.getDataStatus(currentCompanyId);
            if (response.success) {
                setDataStatus(response.data);
            }
        } catch (error) {
            console.error('加载数据状态失败:', error);
        } finally {
            setLoadingDataStatus(false);
        }
    };

    // 添加文件预检查功能
    const preCheckFile = async (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    console.log('文件预检查:', file.name);
                    console.log('文件类型:', file.type);
                    console.log('文件大小:', file.size);
                    resolve(true);
                } catch (error) {
                    console.error('文件预检查失败:', error);
                    resolve(false);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    };

    // 检查是否需要策略选择
    const checkForDuplicateData = async (files) => {
        if (!currentCompanyId) {
            alert('请先选择企业');
            return false;
        }
        return true;
    };

    // 显示导入策略选择对话框
    const showImportStrategyDialog = (files) => {
        setPendingFiles(files);
        setShowStrategyModal(true);
    };

    // 确认导入策略并执行上传
    const confirmImportStrategy = async () => {
        setShowStrategyModal(false);
        await executeFileUpload(pendingFiles, importStrategy);
        setPendingFiles([]);
    };

    // 批量文件上传处理 - 增加策略选择
    const handleBatchFileUpload = async (files) => {
        if (!currentCompanyId) {
            alert('请先选择企业');
            return;
        }

        if (!files || files.length === 0) {
            alert('请选择文件');
            return;
        }

        // 预检查所有文件
        console.log('开始预检查文件...');
        for (let file of files) {
            console.log(`检查文件: ${file.name}`);
            console.log(`- 文件类型: ${file.type}`);
            console.log(`- 文件大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        }

        // 检查文件类型和大小
        const validFiles = [];
        const invalidFiles = [];

        for (let file of files) {
            const allowedTypes = ['.xlsx', '.xls'];
            const fileName = file.name.toLowerCase();
            const isValidType = allowedTypes.some(type => fileName.endsWith(type));

            if (!isValidType) {
                invalidFiles.push(`${file.name}: 不支持的文件类型（仅支持.xlsx和.xls）`);
                continue;
            }

            if (file.size > 10 * 1024 * 1024) {
                invalidFiles.push(`${file.name}: 文件大小超过10MB`);
                continue;
            }

            if (file.size === 0) {
                invalidFiles.push(`${file.name}: 文件为空`);
                continue;
            }

            validFiles.push(file);
        }

        if (invalidFiles.length > 0) {
            alert('以下文件有问题：\n' + invalidFiles.join('\n'));
            if (validFiles.length === 0) return;
        }

        // 检查是否有多年数据，显示策略选择对话框
        const needsStrategy = await checkForDuplicateData(validFiles);
        if (needsStrategy && validFiles.length > 1) {
            showImportStrategyDialog(validFiles);
        } else {
            await executeFileUpload(validFiles, 'append');
        }
    };

    // 执行文件上传
    const executeFileUpload = async (files, strategy) => {
        setBatchUploading(true);
        setBatchProgress(0);
        setBatchResults(null);
        setCurrentProcessingFile('准备上传...');
        setShowBatchModal(true);

        try {
            console.log(`开始批量上传 ${files.length} 个文件，企业ID: ${currentCompanyId}，策略: ${strategy}`);

            // 模拟进度更新
            const progressInterval = setInterval(() => {
                setBatchProgress(prev => {
                    if (prev < 90) {
                        return prev + 10;
                    }
                    return prev;
                });
            }, 500);

            setCurrentProcessingFile('正在上传文件...');

            // 传递导入策略到后端
            const response = await ApiService.uploadBatchFiles(currentCompanyId, files, strategy);

            clearInterval(progressInterval);
            setBatchResults(response.data);
            setBatchProgress(100);
            setCurrentProcessingFile('处理完成');

            console.log('批量上传完成:', response);

            // 上传完成后重新加载数据状态
            await loadDataStatus();

        } catch (error) {
            console.error('批量上传失败:', error);
            setBatchResults({
                totalFiles: files.length,
                successCount: 0,
                failureCount: files.length,
                results: files.map(file => ({
                    fileName: file.name,
                    fileType: '处理失败',
                    success: false,
                    message: error.message,
                    data: null
                }))
            });
            setCurrentProcessingFile('处理失败');
        } finally {
            setBatchUploading(false);
        }
    };

    // 关闭批量上传结果对话框
    const closeBatchModal = () => {
        setShowBatchModal(false);
        setBatchResults(null);
        setBatchProgress(0);
        setCurrentProcessingFile('');
    };

    // 单文件上传处理（保持原有功能）
    const handleFileUpload = async (uploadType, file) => {
        if (!currentCompanyId) {
            alert('请先选择企业');
            return;
        }

        if (!file) {
            alert('请选择文件');
            return;
        }

        // 检查文件类型
        const allowedTypes = ['.xlsx', '.xls'];
        const fileName = file.name.toLowerCase();
        const isValidType = allowedTypes.some(type => fileName.endsWith(type));

        if (!isValidType) {
            alert('请选择Excel文件(.xlsx 或 .xls)');
            return;
        }

        // 检查文件大小 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('文件大小不能超过10MB');
            return;
        }

        try {
            console.log(`开始上传文件: ${uploadType}, 企业ID: ${currentCompanyId}, 文件: ${file.name}`);

            setUploadProgress(prev => ({ ...prev, [uploadType]: 0 }));
            setUploadResults(prev => {
                const newResults = { ...prev };
                delete newResults[uploadType];
                return newResults;
            });

            // 模拟进度更新
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    const currentProgress = prev[uploadType] || 0;
                    if (currentProgress < 90) {
                        return { ...prev, [uploadType]: currentProgress + 10 };
                    }
                    return prev;
                });
            }, 200);

            let response;
            switch (uploadType) {
                case 'company-info':
                    response = await ApiService.uploadCompanyInfo(currentCompanyId, file);
                    break;
                case 'balance-sheet':
                    response = await ApiService.uploadBalanceSheet(currentCompanyId, file);
                    break;
                case 'income-statement':
                    response = await ApiService.uploadIncomeStatement(currentCompanyId, file);
                    break;
                case 'tax-reports':
                    response = await ApiService.uploadTaxReports(currentCompanyId, file);
                    break;
                case 'invoice-data':
                    response = await ApiService.uploadInvoiceData(currentCompanyId, file);
                    break;
                case 'hr-salary':
                    response = await ApiService.uploadHRSalaryData(currentCompanyId, file);
                    break;
                case 'account-balance':
                    response = await ApiService.uploadAccountBalance(currentCompanyId, file);
                    break;
                default:
                    throw new Error('未知的上传类型');
            }

            clearInterval(progressInterval);
            setUploadProgress(prev => ({ ...prev, [uploadType]: 100 }));

            console.log('上传响应:', response);

            if (response.success) {
                setUploadResults(prev => ({
                    ...prev,
                    [uploadType]: { success: true, message: response.message }
                }));
                alert(response.message);

                // 上传成功后重新加载数据状态
                await loadDataStatus();
            } else {
                throw new Error(response.message || '上传失败');
            }
        } catch (error) {
            console.error('上传失败详情:', error);

            let errorMessage = '上传失败';
            if (error.message) {
                errorMessage += ': ' + error.message;
            }

            setUploadResults(prev => ({
                ...prev,
                [uploadType]: { success: false, message: errorMessage }
            }));
            alert(errorMessage);
        } finally {
            // 3秒后清除进度
            setTimeout(() => {
                setUploadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[uploadType];
                    return newProgress;
                });
            }, 3000);
        }
    };

    const createNewCompany = async () => {
        const name = window.prompt('请输入企业名称:');
        if (!name || !name.trim()) return;

        try {
            const companyData = {
                name: name.trim(),
                tax_code: '',
                company_type: '有限责任公司',
                legal_person: '',
                registered_capital: 0,
                establishment_date: new Date().toISOString().split('T')[0],
                business_term: '长期',
                address: '',
                business_scope: '',
                industry: '',
                industry_code: '',
                company_scale: '中型企业',
                employee_count: 0,
                shareholder_info: ''
            };

            console.log('创建企业数据:', companyData);
            const response = await ApiService.createCompany(companyData);
            console.log('创建企业响应:', response);

            if (response.success) {
                alert('企业创建成功');
                await loadCompanies();
            } else {
                throw new Error(response.message || '创建失败');
            }
        } catch (error) {
            console.error('创建企业失败:', error);
            alert('创建企业失败: ' + error.message);
        }
    };

    const openDeleteModal = () => {
        setShowDeleteModal(true);
        setSelectedCompanies([]);
        setShowConfirmDialog(false);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setSelectedCompanies([]);
        setShowConfirmDialog(false);
    };

    const handleCompanySelect = (companyId) => {
        setSelectedCompanies(prev => {
            if (prev.includes(companyId)) {
                return prev.filter(id => id !== companyId);
            } else {
                return [...prev, companyId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedCompanies.length === companies.length) {
            setSelectedCompanies([]);
        } else {
            setSelectedCompanies(companies.map(c => c.id));
        }
    };

    const showDeleteConfirmation = () => {
        console.log('点击删除按钮，选中的企业：', selectedCompanies);
        if (selectedCompanies.length === 0) {
            alert('请选择要删除的企业');
            return;
        }
        console.log('显示确认删除对话框');
        setShowConfirmDialog(true);
    };

    const cancelConfirmDelete = () => {
        console.log('取消确认删除');
        setShowConfirmDialog(false);
    };

    const confirmDelete = async () => {
        console.log('开始执行删除操作，企业IDs：', selectedCompanies);
        setIsDeleting(true);
        try {
            let response;
            if (selectedCompanies.length === 1) {
                console.log('执行单个删除，企业ID：', selectedCompanies[0]);
                response = await ApiService.deleteCompany(selectedCompanies[0]);
            } else {
                console.log('执行批量删除，企业IDs：', selectedCompanies);
                response = await ApiService.deleteCompanies(selectedCompanies);
            }

            console.log('删除响应：', response);

            if (response.success) {
                alert(response.message);
                await loadCompanies();
                closeDeleteModal();
            } else {
                throw new Error(response.message || '删除失败');
            }
        } catch (error) {
            console.error('删除企业失败:', error);
            alert('删除企业失败: ' + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const getSelectedCompanyNames = () => {
        return companies
            .filter(c => selectedCompanies.includes(c.id))
            .map(c => c.name)
            .join('、');
    };

    // 数据状态组件
    const DataStatusIndicator = ({ hasData, label, details }) => (
        <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center space-x-2 mb-2">
                {hasData ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                )}
                <span className={`font-medium ${hasData ? 'text-green-700' : 'text-orange-700'}`}>
                    {label}
                </span>
            </div>
            {hasData && details ? (
                <div className="space-y-1">
                    {details.map((detail, index) => (
                        <div key={index} className="text-sm text-gray-600 flex justify-between">
                            <span>{detail.period}</span>
                            <span className="text-green-600">{detail.count}条记录</span>
                        </div>
                    ))}
                </div>
            ) : !hasData ? (
                <p className="text-sm text-orange-600">数据缺失，请上传相关文件</p>
            ) : null}
        </div>
    );

    const uploadComponents = [
        {
            id: 'company-info',
            title: '企业注册登记信息',
            description: '包含企业名称、法人、注册资本、股东信息等基础数据',
            icon: Building,
            color: 'blue',
            templateName: 'company_info_template.xlsx'
        },
        {
            id: 'balance-sheet',
            title: '资产负债表',
            description: '标准格式的资产负债表，包含资产、负债、所有者权益数据',
            icon: FileText,
            color: 'green',
            templateName: 'balance_sheet_template.xlsx'
        },
        {
            id: 'income-statement',
            title: '利润表',
            description: '标准格式的利润表，包含收入、成本、费用、利润数据',
            icon: FileText,
            color: 'purple',
            templateName: 'income_statement_template.xlsx'
        },
        {
            id: 'tax-reports',
            title: '纳税申报表',
            description: '各税种申报数据汇总，包含增值税、企业所得税等',
            icon: Database,
            color: 'orange',
            templateName: 'tax_reports_template.xlsx'
        },
        {
            id: 'invoice-data',
            title: '发票数据',
            description: '发票开具和接收统计数据，按发票类型分类',
            icon: FileText,
            color: 'teal',
            templateName: 'invoice_data_template.xlsx'
        },
        {
            id: 'hr-salary',
            title: '人事工资数据',
            description: '各部门人员结构和薪酬水平统计',
            icon: Users,
            color: 'indigo',
            templateName: 'hr_salary_template.xlsx'
        },
        {
            id: 'account-balance',
            title: '科目余额表',
            description: '会计科目期初余额、发生额、期末余额明细',
            icon: Database,
            color: 'pink',
            templateName: 'account_balance_template.xlsx'
        }
    ];

    return (
        <div className="space-y-6">
            {/* 页面标题和企业选择 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">数据管理中心</h2>
                    <div className="flex space-x-3">
                        <button
                            onClick={createNewCompany}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                        >
                            <Building className="h-4 w-4 mr-2" />
                            新建企业
                        </button>
                        <button
                            onClick={openDeleteModal}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除企业
                        </button>
                    </div>
                </div>

                {selectedCompany && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800">
                            当前企业：<span className="font-bold">{typeof selectedCompany === 'object' ? selectedCompany.name : selectedCompany}</span>
                            {currentCompanyId && <span className="text-blue-600 ml-2">(ID: {currentCompanyId})</span>}
                        </p>
                        {!currentCompanyId && (
                            <p className="text-red-600 text-sm mt-1">
                                警告：未找到企业ID，请检查企业是否存在或重新选择企业
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* 数据完整性状态概览 */}
            {currentCompanyId && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                            数据完整性状态
                        </h3>
                        <button
                            onClick={loadDataStatus}
                            disabled={loadingDataStatus}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 flex items-center"
                        >
                            <RefreshCw className={`h-4 w-4 mr-1 ${loadingDataStatus ? 'animate-spin' : ''}`} />
                            刷新
                        </button>
                    </div>

                    {loadingDataStatus ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">加载数据状态中...</span>
                        </div>
                    ) : dataStatus ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <DataStatusIndicator
                                hasData={dataStatus.hasCompanyInfo}
                                label="企业注册登记信息"
                                details={dataStatus.companyInfoDetails}
                            />
                            <DataStatusIndicator
                                hasData={dataStatus.hasBalanceSheet}
                                label="资产负债表"
                                details={dataStatus.balanceSheetDetails}
                            />
                            <DataStatusIndicator
                                hasData={dataStatus.hasIncomeStatement}
                                label="利润表"
                                details={dataStatus.incomeStatementDetails}
                            />
                            <DataStatusIndicator
                                hasData={dataStatus.hasTaxReports}
                                label="税务申报"
                                details={dataStatus.taxReportsDetails}
                            />
                            <DataStatusIndicator
                                hasData={dataStatus.hasInvoices}
                                label="发票数据"
                                details={dataStatus.invoicesDetails}
                            />
                            <DataStatusIndicator
                                hasData={dataStatus.hasHRData}
                                label="人事薪酬"
                                details={dataStatus.hrDataDetails}
                            />
                            <DataStatusIndicator
                                hasData={dataStatus.hasAccountBalances}
                                label="科目余额"
                                details={dataStatus.accountBalancesDetails}
                            />
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>请选择企业以查看数据状态</p>
                        </div>
                    )}

                    {dataStatus && !Object.values(dataStatus).every(value =>
                        typeof value === 'boolean' ? value : true
                    ) && (
                            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
                                <p className="text-yellow-800 text-sm">
                                    部分数据缺失，企业画像可能不完整。请使用下方的上传功能补充相关数据文件。
                                </p>
                            </div>
                        )}
                </div>
            )}

            {/* 批量上传区域 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-4">
                    <FileStack className="h-6 w-6 text-blue-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">批量数据导入</h3>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                    <FileStack className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                        选择多个Excel文件进行批量导入，系统将自动识别文件类型并导入到对应数据表
                    </p>
                    <label className={`inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors ${!currentCompanyId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <Upload className="h-5 w-5 mr-2" />
                        选择多个文件批量导入
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            multiple
                            onChange={(e) => {
                                const files = Array.from(e.target.files);
                                if (files.length > 0) {
                                    handleBatchFileUpload(files);
                                }
                                e.target.value = '';
                            }}
                            className="hidden"
                            disabled={!currentCompanyId}
                        />
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                        支持Excel格式文件(.xlsx, .xls)，单个文件不超过10MB，最多选择10个文件
                    </p>
                </div>

                {/* 多年数据导入说明 */}
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                        <Calendar className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-medium text-green-900 mb-2">多年数据导入支持：</h4>
                            <div className="text-sm text-green-700 space-y-1">
                                <p>✓ 支持导入同一企业的多年财务数据（如2023年、2024年利润表）</p>
                                <p>✓ 系统会自动识别数据的时间期间，确保多年数据完整保存</p>
                                <p>✓ 相同期间的数据默认会保留最新导入的版本</p>
                                <p>✓ 建议按时间顺序上传文件以确保数据的准确性</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 文件格式说明 */}
                {/* 文件格式说明 */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                        <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-medium text-blue-900 mb-2">系统支持的文件类型识别规则（更新版）：</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700">
                                <div className="space-y-1">
                                    <div><strong>科目余额表：</strong>A1="科目编码"，B1="科目名称"，G1="报告期间"</div>
                                    <div><strong>企业信息：</strong>A1="企业名称"，A2="统一社会信用代码"</div>
                                    <div><strong>资产负债表：</strong>A3="资产负债表"，A4="资产"，B1="报告期间"</div>
                                    <div><strong>利润表：</strong>A2="利润表"，A7="管理费用"，B1="报告期间"</div>
                                </div>
                                <div className="space-y-1">
                                    <div><strong>纳税申报：</strong>A1="税种"，B1="申报期间"，B2开始为具体期间数据</div>
                                    <div><strong>发票数据：</strong>A1="发票类型"，F1="报告期间"（新增）</div>
                                    <div><strong>人事工资：</strong>A1="部门"，B1="人数"，F1="报告期间"（新增）</div>
                                </div>
                            </div>
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                                <h5 className="font-medium text-green-800 mb-2">期间格式支持：</h5>
                                <div className="text-sm text-green-700 space-y-1">
                                    <div>• 年月格式：2024-12、2024年12月、2024/12</div>
                                    <div>• 季度格式：2024年第4季度</div>
                                    <div>• 完整日期：2024-12-01、2024/12/1、2024-12-01 00:00:00</div>
                                    <div>• Excel日期序列号自动转换</div>
                                </div>
                            </div>
                            <p className="text-sm text-blue-600 mt-2">
                                <strong>重要提示：</strong>发票数据、人事薪酬、科目余额需要添加报告期间列，确保多年数据能正确区分。
                            </p>
                        </div>
                    </div>
                </div>

                {/* 调试提示 */}
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">文件识别失败时的解决方法：</h4>
                    <div className="text-sm text-yellow-700 space-y-1">
                        <p>1. 检查Excel文件是否可以正常打开，确保文件未损坏</p>
                        <p>2. 确认A1、A2、B1等关键单元格的内容与上述格式完全一致</p>
                        <p>3. 删除表头中的多余空格、换行符或特殊字符</p>
                        <p>4. 如果是从其他系统导出的文件，建议重新整理格式后再上传</p>
                        <p>5. 查看浏览器控制台（F12）获取详细的错误信息</p>
                    </div>
                </div>
            </div>

            {/* 数据上传卡片网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uploadComponents.map((component) => {
                    const IconComponent = component.icon;
                    const isUploading = uploadProgress[component.id] !== undefined;
                    const uploadResult = uploadResults[component.id];

                    return (
                        <div key={component.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center mb-4">
                                <div className={`w-12 h-12 bg-${component.color}-100 rounded-lg flex items-center justify-center mr-4`}>
                                    <IconComponent className={`h-6 w-6 text-${component.color}-600`} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">{component.title}</h3>
                                    {uploadResult && (
                                        <div className="flex items-center mt-1">
                                            {uploadResult.success ? (
                                                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                                            ) : (
                                                <AlertTriangle className="h-4 w-4 text-red-600 mr-1" />
                                            )}
                                            <span className={`text-xs ${uploadResult.success ? 'text-green-600' : 'text-red-600'}`}>
                                                {uploadResult.success ? '上传成功' : '上传失败'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">{component.description}</p>

                            {/* 进度条 */}
                            {isUploading && (
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs text-gray-600">上传进度</span>
                                        <span className="text-xs text-gray-600">{uploadProgress[component.id]}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`bg-${component.color}-600 h-2 rounded-full transition-all duration-300`}
                                            style={{ width: `${uploadProgress[component.id]}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className={`flex items-center justify-center px-4 py-2 bg-${component.color}-600 text-white rounded-lg hover:bg-${component.color}-700 cursor-pointer transition-colors ${!currentCompanyId || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <Upload className="h-4 w-4 mr-2" />
                                    {isUploading ? '上传中...' : '选择文件上传'}
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                handleFileUpload(component.id, file);
                                            }
                                            e.target.value = '';
                                        }}
                                        className="hidden"
                                        disabled={isUploading || !currentCompanyId}
                                    />
                                </label>

                                <button
                                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    onClick={() => {
                                        alert(`下载${component.title}模板: ${component.templateName}`);
                                    }}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    下载模板
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 使用说明 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">使用说明</h3>
                <div className="space-y-3 text-sm text-gray-600">
                    <p><strong>批量导入（推荐）：</strong>选择多个Excel文件一次性导入，系统自动识别文件类型并分类处理。</p>
                    <p><strong>多年数据导入：</strong>支持导入同一企业不同年份的数据，系统会根据文件中的时间信息自动区分。</p>
                    <p><strong>单个导入：</strong>如果需要精确控制每个文件的导入，可以使用下方的单独上传功能。</p>
                    <div className="pl-4 space-y-1">
                        <p>• 企业注册登记信息（必填基础信息）</p>
                        <p>• 资产负债表和利润表（核心财务数据）</p>
                        <p>• 纳税申报表和发票数据（税务相关数据）</p>
                        <p>• 人事工资数据和科目余额表（补充数据）</p>
                    </div>
                    <p>支持标准Excel格式文件(.xlsx, .xls)，文件大小不超过10MB。</p>
                    <p>数据上传后可在企业画像页面查看分析结果。</p>
                    <p>如有问题，请检查数据格式是否符合模板要求。</p>
                </div>
            </div>

            {/* 导入策略选择对话框 */}
            {showStrategyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">选择数据导入策略</h3>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-4">
                                检测到您要导入多个文件，请选择处理重复数据的方式：
                            </p>

                            <div className="space-y-3">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="strategy"
                                        value="append"
                                        checked={importStrategy === 'append'}
                                        onChange={(e) => setImportStrategy(e.target.value)}
                                        className="mr-3"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">添加新数据（推荐）</div>
                                        <div className="text-sm text-gray-600">保留所有数据，新数据追加到现有数据中</div>
                                    </div>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="strategy"
                                        value="update"
                                        checked={importStrategy === 'update'}
                                        onChange={(e) => setImportStrategy(e.target.value)}
                                        className="mr-3"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">更新重复数据</div>
                                        <div className="text-sm text-gray-600">相同期间的数据会被新数据覆盖</div>
                                    </div>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="strategy"
                                        value="skip"
                                        checked={importStrategy === 'skip'}
                                        onChange={(e) => setImportStrategy(e.target.value)}
                                        className="mr-3"
                                    />
                                    <div>
                                        <div className="font-medium text-gray-900">跳过重复数据</div>
                                        <div className="text-sm text-gray-600">只导入新的期间数据，跳过已存在的数据</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowStrategyModal(false);
                                    setPendingFiles([]);
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmImportStrategy}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                确认导入
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 批量上传结果对话框 */}
            {showBatchModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-96 overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">批量上传进度</h3>
                            {!batchUploading && (
                                <button
                                    onClick={closeBatchModal}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            )}
                        </div>

                        {/* 总体进度 */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">
                                    {batchUploading ? '正在处理...' : '处理完成'}
                                </span>
                                <span className="text-sm text-gray-600">{batchProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${batchProgress}%` }}
                                ></div>
                            </div>
                            {currentProcessingFile && (
                                <p className="text-sm text-gray-600 mt-1">
                                    {currentProcessingFile}
                                </p>
                            )}
                        </div>

                        {/* 结果列表 */}
                        {batchResults && (
                            <div className="flex-1 overflow-y-auto">
                                <div className="mb-4 p-3 bg-gray-50 rounded">
                                    <h4 className="font-medium text-gray-900">
                                        处理结果：成功 {batchResults.successCount} 个，失败 {batchResults.failureCount} 个
                                    </h4>
                                </div>

                                <div className="space-y-2">
                                    {batchResults.results?.map((result, index) => (
                                        <div
                                            key={index}
                                            className={`p-3 border rounded ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    {result.success ? (
                                                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                                                    ) : (
                                                        <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                                                    )}
                                                    <span className="font-medium">{result.fileName}</span>
                                                    <span className="text-sm text-gray-600 ml-2">({result.fileType})</span>
                                                </div>
                                            </div>
                                            <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                                                {result.message}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 底部按钮 */}
                        <div className="flex justify-end pt-4 border-t">
                            {batchUploading ? (
                                <div className="flex items-center text-blue-600">
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    处理中...
                                </div>
                            ) : (
                                <button
                                    onClick={closeBatchModal}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    确定
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 删除企业对话框 */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">删除企业</h3>
                            <button
                                onClick={closeDeleteModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-3">
                                请选择要删除的企业。<span className="text-red-600 font-medium">警告：此操作将删除企业及其所有相关数据，且无法恢复！</span>
                            </p>

                            {companies.length > 0 && (
                                <div className="mb-3">
                                    <label className="flex items-center text-sm">
                                        <input
                                            type="checkbox"
                                            checked={selectedCompanies.length === companies.length && companies.length > 0}
                                            onChange={handleSelectAll}
                                            className="mr-2"
                                        />
                                        全选 ({selectedCompanies.length}/{companies.length})
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto mb-6 space-y-2">
                            {companies.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">暂无企业数据</p>
                            ) : (
                                companies.map((company) => (
                                    <div
                                        key={company.id}
                                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedCompanies.includes(company.id)
                                            ? 'bg-red-50 border-red-200'
                                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            }`}
                                        onClick={() => handleCompanySelect(company.id)}
                                    >
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedCompanies.includes(company.id)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleCompanySelect(company.id);
                                                }}
                                                className="mr-3"
                                            />
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">{company.name}</h4>
                                                <div className="text-sm text-gray-600 grid grid-cols-2 gap-4">
                                                    <span>税号: {company.tax_code || '未填写'}</span>
                                                    <span>行业: {company.industry || '未填写'}</span>
                                                    <span>规模: {company.company_scale || '未填写'}</span>
                                                    <span>创建时间: {company.created_at ? new Date(company.created_at).toLocaleDateString() : '未知'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button
                                onClick={closeDeleteModal}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                disabled={isDeleting}
                            >
                                取消
                            </button>
                            <button
                                onClick={showDeleteConfirmation}
                                disabled={selectedCompanies.length === 0 || isDeleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                删除 ({selectedCompanies.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 确认删除对话框 */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center" style={{ zIndex: 9999 }}>
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
                            <p className="text-sm text-gray-600 mb-3">
                                确定要删除以下企业吗？
                            </p>
                            <div className="bg-red-50 border border-red-200 rounded p-3 mb-3 max-h-32 overflow-y-auto">
                                <p className="text-sm text-red-800 font-medium">
                                    {getSelectedCompanyNames()}
                                </p>
                            </div>
                            <p className="text-sm text-red-600 font-medium">
                                此操作将同时删除企业的所有相关数据，且无法恢复！
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={cancelConfirmDelete}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                disabled={isDeleting}
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {isDeleting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                                {isDeleting ? '删除中...' : '确认删除'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataManagement;