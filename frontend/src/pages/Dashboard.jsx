import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart3, PieChart, Users, FileText } from 'lucide-react';

const Dashboard = ({ selectedCompany, userType, currentUser }) => {
    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">控制台</h1>
                    <p className="text-gray-600">欢迎回来，{currentUser?.name}</p>
                </div>
                <div className="text-sm text-gray-500">
                    当前企业：{selectedCompany}
                </div>
            </div>

            {/* 关键指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">营业收入</p>
                            <p className="text-2xl font-bold text-gray-900">3,800万</p>
                            <div className="flex items-center mt-1">
                                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-sm text-green-600">+15.2%</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BarChart3 className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">净利润</p>
                            <p className="text-2xl font-bold text-gray-900">292万</p>
                            <div className="flex items-center mt-1">
                                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-sm text-green-600">+22.8%</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">税负率</p>
                            <p className="text-2xl font-bold text-gray-900">4.36%</p>
                            <div className="flex items-center mt-1">
                                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                <span className="text-sm text-red-600">-0.8%</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <PieChart className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">员工人数</p>
                            <p className="text-2xl font-bold text-gray-900">156人</p>
                            <div className="flex items-center mt-1">
                                <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                                <span className="text-sm text-blue-600">+12人</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 快速操作和状态 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 快速操作 */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-900">上传财务数据</p>
                        </button>
                        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-900">查看企业画像</p>
                        </button>
                        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-900">风险评估</p>
                        </button>
                        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <PieChart className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-900">税务分析</p>
                        </button>
                    </div>
                </div>

                {/* 系统状态 */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">系统状态</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                                <span className="text-sm text-gray-700">数据同步</span>
                            </div>
                            <span className="text-sm text-green-600">正常</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                                <span className="text-sm text-gray-700">系统运行</span>
                            </div>
                            <span className="text-sm text-green-600">良好</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                                <span className="text-sm text-gray-700">数据完整性</span>
                            </div>
                            <span className="text-sm text-yellow-600">待优化</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                                <span className="text-sm text-gray-700">安全状态</span>
                            </div>
                            <span className="text-sm text-green-600">安全</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 最近活动 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h3>
                <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-900">上传了资产负债表数据</p>
                            <p className="text-xs text-gray-500">2小时前</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-900">完成了税务申报数据导入</p>
                            <p className="text-xs text-gray-500">1天前</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-900">生成了企业画像报告</p>
                            <p className="text-xs text-gray-500">3天前</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;