import React, { useState, useEffect } from 'react';
import { Building, BarChart3, Users, TrendingUp, Calculator, Receipt, FileText, MapPin, PieChart, Plus, RefreshCw, Globe, Truck, AlertTriangle, CheckCircle, Calendar, ChevronDown } from 'lucide-react';
import ApiService from '../../services/api';

const Profile = ({ currentUser, selectedCompany }) => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [currentCompanyId, setCurrentCompanyId] = useState(null);

    // 新增：报告期相关状态
    const [availablePeriods, setAvailablePeriods] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

    useEffect(() => {
        loadCompanies();
    }, []);

    useEffect(() => {
        if (selectedCompany && companies.length > 0) {
            loadAvailablePeriods();
        }
    }, [selectedCompany, companies]);

    useEffect(() => {
        if (selectedPeriod && currentCompanyId) {
            loadProfile();
        }
    }, [selectedPeriod, currentCompanyId]);

    const loadCompanies = async () => {
        try {
            const response = await ApiService.getCompanies();
            if (response.success) {
                setCompanies(response.data);
            }
        } catch (error) {
            console.error('加载企业列表失败:', error);
            setError('无法连接到服务器，请检查后端服务是否启动');
        }
    };

    const loadAvailablePeriods = async () => {
        try {
            let companyId = null;

            if (typeof selectedCompany === 'object' && selectedCompany.id) {
                companyId = selectedCompany.id;
            } else {
                const company = companies.find(c => c.name === selectedCompany);
                if (company) {
                    companyId = company.id;
                } else if (companies.length > 0) {
                    companyId = companies[0].id;
                    console.log(`未找到企业"${selectedCompany}"，使用第一个企业:`, companies[0].name);
                }
            }

            if (!companyId) {
                throw new Error('没有可用的企业数据');
            }

            setCurrentCompanyId(companyId);

            // 获取所有可用的报告期
            const periods = await ApiService.getAvailablePeriods(companyId);
            if (periods.success) {
                setAvailablePeriods(periods.data);
                // 默认选择最新的报告期
                if (periods.data.length > 0 && !selectedPeriod) {
                    setSelectedPeriod(periods.data[0]);
                }
            }
        } catch (error) {
            console.error('加载可用报告期失败:', error);
            setError(error.message);
        }
    };

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log(`开始加载企业画像 - 企业ID: ${currentCompanyId}, 报告期: ${selectedPeriod?.period_key}`);

            const response = await ApiService.getCompanyProfileByPeriod(currentCompanyId, selectedPeriod);
            if (response.success) {
                setProfileData(response.data);
            } else {
                throw new Error(response.message || '获取企业画像失败');
            }
        } catch (err) {
            setError(err.message);
            console.error('加载企业画像失败:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatPeriodDisplay = (period) => {
        if (!period) return '';
        const { period_year, period_month, period_quarter } = period;
        if (period_month && period_month !== 12) {
            return `${period_year}年${period_month}月`;
        } else if (period_quarter) {
            return `${period_year}年第${period_quarter}季度`;
        } else {
            return `${period_year}年`;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">正在生成企业画像...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <strong className="font-bold">错误：</strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                    <button
                        onClick={loadProfile}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center mx-auto"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        重试
                    </button>
                </div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">暂无企业画像数据</p>
                    <button
                        onClick={loadProfile}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        重新加载
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* 页面标题和报告期选择 */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">企业画像</h1>
                <p className="text-gray-600 mt-2">{profileData.basicInfo?.name}</p>
                {currentCompanyId && (
                    <p className="text-sm text-gray-500">企业ID: {currentCompanyId}</p>
                )}

                {/* 报告期选择器 */}
                {availablePeriods.length > 0 && (
                    <div className="mt-4 flex justify-center">
                        <div className="relative">
                            <button
                                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">
                                    报告期: {formatPeriodDisplay(selectedPeriod)}
                                </span>
                                <ChevronDown className="h-4 w-4 ml-2 text-gray-500" />
                            </button>

                            {showPeriodDropdown && (
                                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                                    {availablePeriods.map((period, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setSelectedPeriod(period);
                                                setShowPeriodDropdown(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${selectedPeriod?.period_key === period.period_key
                                                    ? 'bg-blue-50 text-blue-700'
                                                    : 'text-gray-700'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span>{formatPeriodDisplay(period)}</span>
                                                <span className="text-xs text-gray-500">
                                                    {period.data_types?.join(', ')}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 第一行：基础信息和行业特征 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 基础信息 */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <Building className="h-6 w-6 mr-3 text-blue-600" />
                        基础信息
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 border-b pb-2">企业基本信息</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">企业名称</span>
                                    <span className="font-medium">{profileData.basicInfo.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">企业类型</span>
                                    <span className="font-medium">{profileData.basicInfo.companyType || '未填写'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">法定代表人</span>
                                    <span className="font-medium">{profileData.basicInfo.legalPerson || '未填写'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">注册资本</span>
                                    <span className="font-medium">{profileData.basicInfo.registeredCapital}万元</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">员工人数</span>
                                    <span className="font-medium">{profileData.basicInfo.employeeCount}人</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 border-b pb-2">股权结构</h4>
                            <div className="space-y-3">
                                {profileData.basicInfo.shareholders?.length > 0 ? (
                                    profileData.basicInfo.shareholders.map((shareholder, index) => (
                                        <div key={index} className="flex justify-between">
                                            <span className="text-sm text-gray-600">{shareholder.name}</span>
                                            <span className="font-medium">{shareholder.ratio}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-500">股东信息未填写</div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">成立日期</span>
                                    <span className="font-medium">{profileData.basicInfo.establishmentDate || '未填写'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">企业规模</span>
                                    <span className="font-medium">{profileData.basicInfo.companyScale || '未填写'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 border-b pb-2">行业信息</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">所属行业</span>
                                    <span className="font-medium">{profileData.basicInfo.industry || '未填写'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">行业代码</span>
                                    <span className="font-medium">{profileData.basicInfo.industryCode || '未填写'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">统一社会信用代码</span>
                                    <span className="font-medium text-sm">{profileData.basicInfo.taxCode || '未填写'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">注册地址</span>
                                    <span className="font-medium text-sm">{profileData.basicInfo.address || '未填写'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 行业特征 */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <Globe className="h-6 w-6 mr-3 text-blue-600" />
                        行业特征
                    </h3>
                    <div className="space-y-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">行业分类代码</span>
                                <span className="font-mono text-blue-600">{profileData.industryProfile?.classification || '未分类'}</span>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-700">行业特点</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {profileData.industryProfile?.characteristics?.map((char, index) => (
                                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                        {char}
                                    </span>
                                )) || <span className="text-gray-500 text-xs">暂无数据</span>}
                            </div>
                        </div>
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">行业排名</span>
                                <span className="font-bold text-purple-600">{profileData.industryProfile?.marketPosition?.ranking || '数据不足'}</span>
                            </div>
                        </div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">市场份额</span>
                                <span className="font-bold text-green-600">{profileData.industryProfile?.marketPosition?.marketShare || '数据不足'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 财务经营指标 */}
            {profileData.financialIndicators ? (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <BarChart3 className="h-6 w-6 mr-3 text-blue-600" />
                        财务经营指标
                        {selectedPeriod && (
                            <span className="ml-3 text-sm font-normal text-gray-500">
                                ({formatPeriodDisplay(selectedPeriod)})
                            </span>
                        )}
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* 盈利能力 */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                盈利能力
                            </h4>
                            <div className="space-y-2">
                                {Object.entries(profileData.financialIndicators.profitability || {}).map(([key, data], index) => (
                                    <div key={index} className="flex justify-between items-center py-1">
                                        <span className="text-xs text-gray-600">{key}</span>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-gray-900">{data.value}</span>
                                            {data.growth && (
                                                <span className={`text-xs ml-1 ${data.growth.includes('-') ? 'text-red-600' : 'text-green-600'}`}>
                                                    {data.growth}
                                                </span>
                                            )}
                                            {data.level && (
                                                <span className={`text-xs ml-1 ${data.level.includes('优秀') || data.level.includes('良好') ? 'text-green-600' :
                                                    data.level.includes('一般') || data.level.includes('适中') ? 'text-blue-600' : 'text-orange-600'
                                                    }`}>
                                                    {data.level}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 偿债能力 */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                                <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                                偿债能力
                            </h4>
                            <div className="space-y-2">
                                {Object.entries(profileData.financialIndicators.solvency || {}).map(([key, data], index) => (
                                    <div key={index} className="flex justify-between items-center py-1">
                                        <span className="text-xs text-gray-600">{key}</span>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-gray-900">{data.value}</span>
                                            {data.level && (
                                                <span className={`text-xs ml-1 ${data.level.includes('优秀') || data.level.includes('良好') ? 'text-green-600' :
                                                    data.level.includes('适中') ? 'text-blue-600' : 'text-orange-600'
                                                    }`}>
                                                    {data.level}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 运营能力 */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                运营能力
                            </h4>
                            <div className="space-y-2">
                                {Object.entries(profileData.financialIndicators.efficiency || {}).map(([key, data], index) => (
                                    <div key={index} className="flex justify-between items-center py-1">
                                        <span className="text-xs text-gray-600">{key}</span>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-gray-900">{data.value}</span>
                                            {data.level && (
                                                <span className={`text-xs ml-1 ${data.level.includes('优秀') || data.level.includes('良好') ? 'text-green-600' :
                                                    data.level.includes('一般') ? 'text-blue-600' : 'text-orange-600'
                                                    }`}>
                                                    {data.level}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 发展能力 */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                                发展能力
                            </h4>
                            <div className="space-y-2">
                                {Object.keys(profileData.financialIndicators.growth || {}).length > 0 ? (
                                    Object.entries(profileData.financialIndicators.growth).map(([key, data], index) => (
                                        <div key={index} className="flex justify-between items-center py-1">
                                            <span className="text-xs text-gray-600">{key}</span>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-gray-900">{data.value}</span>
                                                {data.level && (
                                                    <span className={`text-xs ml-1 ${data.level.includes('高速') || data.level.includes('快速') || data.level.includes('优秀') ? 'text-green-600' :
                                                        data.level.includes('稳定') || data.level.includes('良好') ? 'text-blue-600' :
                                                            data.level.includes('缓慢') || data.level.includes('一般') ? 'text-yellow-600' : 'text-red-600'
                                                        }`}>
                                                        {data.level}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-xs text-gray-500">
                                        <p>需要多期数据对比</p>
                                        <p className="mt-1">请上传上期财务数据以计算增长率</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">财务经营指标</h3>
                    <p className="text-yellow-700">缺少资产负债表和利润表数据，无法计算财务指标。请上传相关财务数据。</p>
                </div>
            )}

            {/* 人力资源与薪酬结构 */}
            {profileData.hrAndSalary ? (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <Users className="h-6 w-6 mr-3 text-blue-600" />
                        人力资源与薪酬结构
                        {selectedPeriod && (
                            <span className="ml-3 text-sm font-normal text-gray-500">
                                ({formatPeriodDisplay(selectedPeriod)})
                            </span>
                        )}
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 border-b pb-2">人员结构分析</h4>
                            <div className="space-y-3">
                                {profileData.hrAndSalary.employeeStructure?.map((dept, index) => (
                                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">{dept.department}</span>
                                            <div className="text-right">
                                                <span className="text-lg font-bold text-blue-600">{dept.count}人</span>
                                                <div className="text-xs text-blue-700">占比: {dept.ratio}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-blue-700 mt-1">
                                            平均薪资: {dept.avgSalary}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 border-b pb-2">薪酬福利概况</h4>
                            <div className="space-y-3">
                                <div className="p-3 bg-green-50 border border-green-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">员工总数</span>
                                        <span className="text-lg font-bold text-green-600">
                                            {profileData.hrAndSalary.compensationStructure?.totalEmployees}人
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">平均薪资</span>
                                        <span className="text-lg font-bold text-purple-600">
                                            {profileData.hrAndSalary.compensationStructure?.averageSalary}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">社保覆盖率</span>
                                        <span className="text-lg font-bold text-orange-600">
                                            {profileData.hrAndSalary.compensationStructure?.socialInsuranceCoverage}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-teal-50 border border-teal-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">公积金覆盖率</span>
                                        <span className="text-lg font-bold text-teal-600">
                                            {profileData.hrAndSalary.compensationStructure?.housingFundCoverage}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">人力资源与薪酬结构</h3>
                    <p className="text-yellow-700">缺少人事薪酬数据，无法展示人力资源结构。请上传人事薪酬数据。</p>
                </div>
            )}

            {/* 供应链与运营管理 */}
            {profileData.supplyChainData ? (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <Truck className="h-6 w-6 mr-3 text-blue-600" />
                        供应链与运营管理
                        {selectedPeriod && (
                            <span className="ml-3 text-sm font-normal text-gray-500">
                                ({formatPeriodDisplay(selectedPeriod)})
                            </span>
                        )}
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">应收账款</span>
                                <span className="text-lg font-bold text-blue-600">{profileData.supplyChainData.accountsReceivable}</span>
                            </div>
                        </div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">应付账款</span>
                                <span className="text-lg font-bold text-green-600">{profileData.supplyChainData.accountsPayable}</span>
                            </div>
                        </div>
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">存货水平</span>
                                <span className="text-lg font-bold text-purple-600">{profileData.supplyChainData.inventoryLevel}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">供应链与运营管理</h3>
                    <p className="text-yellow-700">缺少科目余额数据，无法分析供应链情况。请上传科目余额表。</p>
                </div>
            )}

            {/* 纳税申报 */}
            {profileData.taxReporting ? (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <Calculator className="h-6 w-6 mr-3 text-blue-600" />
                        纳税申报
                        {selectedPeriod && (
                            <span className="ml-3 text-sm font-normal text-gray-500">
                                ({formatPeriodDisplay(selectedPeriod)})
                            </span>
                        )}
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 企业所得税 */}
                        {profileData.taxReporting.corporateIncomeTax && (
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900 border-b pb-2">企业所得税</h4>
                                <div className="space-y-3">
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">应纳税所得额</span>
                                            <span className="text-lg font-bold text-blue-600">
                                                {profileData.taxReporting.corporateIncomeTax.taxableIncome}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">税率</span>
                                            <span className="text-lg font-bold text-green-600">
                                                {(profileData.taxReporting.corporateIncomeTax.taxRate * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">应纳税额</span>
                                            <span className="text-lg font-bold text-purple-600">
                                                {profileData.taxReporting.corporateIncomeTax.taxAmount}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 增值税 */}
                        {profileData.taxReporting.valueAddedTax && (
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900 border-b pb-2">增值税</h4>
                                <div className="space-y-3">
                                    <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">应税销售额</span>
                                            <span className="text-lg font-bold text-orange-600">
                                                {profileData.taxReporting.valueAddedTax.taxableAmount}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-teal-50 border border-teal-200 rounded">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">税率</span>
                                            <span className="text-lg font-bold text-teal-600">
                                                {(profileData.taxReporting.valueAddedTax.taxRate * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">应纳税额</span>
                                            <span className="text-lg font-bold text-indigo-600">
                                                {profileData.taxReporting.valueAddedTax.taxAmount}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">纳税申报</h3>
                    <p className="text-yellow-700">缺少税务申报数据，无法展示纳税情况。请上传纳税申报数据。</p>
                </div>
            )}

            {/* 发票及交易 */}
            {profileData.invoiceTransactions ? (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <Receipt className="h-6 w-6 mr-3 text-blue-600" />
                        发票及交易
                        {selectedPeriod && (
                            <span className="ml-3 text-sm font-normal text-gray-500">
                                ({formatPeriodDisplay(selectedPeriod)})
                            </span>
                        )}
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 border-b pb-2">发票开具情况</h4>
                            <div className="space-y-3">
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">专票开具金额</span>
                                        <span className="text-lg font-bold text-blue-600">
                                            {profileData.invoiceTransactions.issuance?.specialVATAmount}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-green-50 border border-green-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">普票开具金额</span>
                                        <span className="text-lg font-bold text-green-600">
                                            {profileData.invoiceTransactions.issuance?.normalVATAmount}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">发票总份数</span>
                                        <span className="text-lg font-bold text-purple-600">
                                            {profileData.invoiceTransactions.issuance?.totalCount}份
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 border-b pb-2">业务税率结构</h4>
                            <div className="space-y-3">
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">主要税率</span>
                                        <span className="text-lg font-bold text-orange-600">
                                            {profileData.invoiceTransactions.businessTaxStructure?.mainTaxRate}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-teal-50 border border-teal-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">应税金额</span>
                                        <span className="text-lg font-bold text-teal-600">
                                            {profileData.invoiceTransactions.businessTaxStructure?.taxableAmount}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">发票及交易</h3>
                    <p className="text-yellow-700">缺少发票数据，无法展示交易情况。请上传发票数据。</p>
                </div>
            )}

            {/* 税务遵从 */}
            {profileData.taxCompliance ? (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <FileText className="h-6 w-6 mr-3 text-blue-600" />
                        税务遵从
                        {selectedPeriod && (
                            <span className="ml-3 text-sm font-normal text-gray-500">
                                ({formatPeriodDisplay(selectedPeriod)})
                            </span>
                        )}
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 border-b pb-2">申报合规情况</h4>
                            <div className="space-y-3">
                                <div className="p-3 bg-green-50 border border-green-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">申报状态</span>
                                        <span className="text-lg font-bold text-green-600">
                                            {profileData.taxCompliance.taxFilingStatus}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">税负率</span>
                                        <span className="text-lg font-bold text-blue-600">
                                            {profileData.taxCompliance.taxBurdenRate}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">纳税信用等级</span>
                                        <span className="text-lg font-bold text-purple-600">
                                            {profileData.taxCompliance.complianceRating}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 border-b pb-2">发票管理</h4>
                            <div className="space-y-3">
                                <div className="p-3 bg-green-50 border border-green-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">发票合规率</span>
                                        <span className="text-lg font-bold text-green-600">
                                            {profileData.taxCompliance.invoiceManagement?.complianceRate}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">电子发票使用率</span>
                                        <span className="text-lg font-bold text-blue-600">
                                            {profileData.taxCompliance.invoiceManagement?.electronicInvoiceRate}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">税务遵从</h3>
                    <p className="text-yellow-700">缺少税务申报和发票数据，无法评估税务遵从情况。</p>
                </div>
            )}

            {/* 组织架构 */}
            {profileData.organizationalStructure && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <TrendingUp className="h-6 w-6 mr-3 text-blue-600" />
                        组织架构
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 股权结构 */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 border-b pb-2">股权结构</h4>
                            <div className="space-y-3">
                                {profileData.organizationalStructure.equityStructure?.length > 0 ? (
                                    profileData.organizationalStructure.equityStructure.map((shareholder, index) => (
                                        <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium">{shareholder.name}</span>
                                                <span className="text-lg font-bold text-blue-600">{shareholder.ratio}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-500">股权结构信息未填写</div>
                                )}
                            </div>
                        </div>

                        {/* 人员结构 */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 border-b pb-2">人员结构</h4>
                            <div className="space-y-3">
                                {profileData.organizationalStructure.personnelStructure?.length > 0 ? (
                                    profileData.organizationalStructure.personnelStructure.map((dept, index) => (
                                        <div key={index} className="p-3 bg-green-50 border border-green-200 rounded">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium">{dept.department}</span>
                                                <div className="text-right">
                                                    <span className="text-lg font-bold text-green-600">{dept.count}人</span>
                                                    <div className="text-xs text-green-700">占比: {dept.ratio}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-500">人员结构数据缺失，请上传人事薪酬数据</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 税负分析与同行业对比 */}
            {profileData.taxBurdenAnalysis ? (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <PieChart className="h-6 w-6 mr-3 text-blue-600" />
                        税负分析与同行业对比
                        {selectedPeriod && (
                            <span className="ml-3 text-sm font-normal text-gray-500">
                                ({formatPeriodDisplay(selectedPeriod)})
                            </span>
                        )}
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 border-b pb-2">实际税负水平</h4>
                            <div className="space-y-3">
                                {Object.entries(profileData.taxBurdenAnalysis.actualTaxBurden || {}).map(([taxType, rate], index) => (
                                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">{taxType}税负率</span>
                                            <span className="text-lg font-bold text-blue-600">{rate}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900 border-b pb-2">优化建议</h4>
                            <div className="space-y-3">
                                {profileData.taxBurdenAnalysis.optimizationSpace?.map((suggestion, index) => (
                                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded">
                                        <span className="text-sm text-green-700">{suggestion}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">税负分析与同行业对比</h3>
                    <p className="text-yellow-700">缺少税务申报和利润表数据，无法进行税负分析。</p>
                </div>
            )}

            {/* 数据完善提示 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">完善企业画像</h3>
                <p className="text-blue-700 mb-4">
                    为了生成更完整和准确的企业画像，请在数据管理页面上传以下数据：
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded border bg-white border-gray-300">
                        <p className="text-sm font-medium">资产负债表</p>
                        <p className="text-xs text-gray-600">财务状况分析</p>
                    </div>
                    <div className="p-3 rounded border bg-white border-gray-300">
                        <p className="text-sm font-medium">利润表</p>
                        <p className="text-xs text-gray-600">盈利能力分析</p>
                    </div>
                    <div className="p-3 rounded border bg-white border-gray-300">
                        <p className="text-sm font-medium">纳税申报表</p>
                        <p className="text-xs text-gray-600">税务合规分析</p>
                    </div>
                    <div className="p-3 rounded border bg-white border-gray-300">
                        <p className="text-sm font-medium">发票数据</p>
                        <p className="text-xs text-gray-600">交易分析</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;