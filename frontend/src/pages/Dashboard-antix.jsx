import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart3, PieChart, Users, FileText, RefreshCw } from 'lucide-react';
import ApiService from '../services/api';

const Dashboard = ({ selectedCompany, userType, currentUser, companies }) => {
    const [metrics, setMetrics] = useState(null);
    const [systemStatus, setSystemStatus] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);

    // 加载Dashboard数据
    const loadDashboardData = async () => {
        setLoading(true);
        setError(null);

        try {
            // 获取当前选中的企业ID
            const company = companies?.find(c => c.name === selectedCompany);
            if (!company) {
                setError('未找到选中的企业');
                setLoading(false);
                return;
            }

            console.log('加载Dashboard数据，企业ID:', company.id);

            // 并行加载所有数据
            const [metricsRes, statusRes, activitiesRes] = await Promise.all([
                ApiService.getDashboardMetrics(company.id),
                ApiService.getSystemStatus(),
                ApiService.getRecentActivities(company.id, 5)
            ]);

            console.log('Dashboard数据加载完成:', { metricsRes, statusRes, activitiesRes });

            setMetrics(metricsRes.data);
            setSystemStatus(statusRes.data);
            setActivities(activitiesRes.data || []);
            setLastRefresh(new Date());
        } catch (err) {
            console.error('加载Dashboard数据失败:', err);
            setError(err.message || '加载数据失败');
        } finally {
            setLoading(false);
        }
    };

    // 当选中企业变化时重新加载数据
    useEffect(() => {
        if (companies && companies.length > 0) {
            loadDashboardData();
        }
    }, [selectedCompany, companies]);

    // 手动刷新
    const handleRefresh = () => {
        loadDashboardData();
    };

    // 获取趋势图标
    const getTrendIcon = (trend) => {
        if (trend === 'up') {
            return <TrendingUp className="h-4 w-4 text-green-500 mr-1" />;
        } else if (trend === 'down') {
            return <TrendingDown className="h-4 w-4 text-red-500 mr-1" />;
        }
        return null;
    };

    // 获取趋势颜色
    const getTrendColor = (trend, value) => {
        if (trend === 'up' && value >= 0) return 'text-green-600';
        if (trend === 'down' && value < 0) return 'text-red-600';
        if (trend === 'down' && value >= 0) return 'text-green-600'; // 税负率下降是好事
        return 'text-gray-600';
    };

    // 获取状态图标
    const getStatusIcon = (status) => {
        switch (status) {
            case 'normal':
            case 'good':
            case 'safe':
                return <CheckCircle className="h-5 w-5 text-green-500 mr-3" />;
            case 'warning':
                return <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />;
            case 'error':
                return <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />;
            default:
                return <CheckCircle className="h-5 w-5 text-gray-500 mr-3" />;
        }
    };

    // 获取状态颜色
    const getStatusColor = (status) => {
        switch (status) {
            case 'normal':
            case 'good':
            case 'safe':
                return 'text-green-600';
            case 'warning':
                return 'text-yellow-600';
            case 'error':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    // 加载中状态
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">控制台</h1>
                        <p className="text-gray-600">加载中...</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 错误状态
    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">控制台</h1>
                        <p className="text-gray-600">欢迎回来，{currentUser?.name}</p>
                    </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center">
                        <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
                        <div>
                            <h3 className="text-lg font-semibold text-red-900">加载失败</h3>
                            <p className="text-red-700">{error}</p>
                            <button
                                onClick={handleRefresh}
                                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                重试
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 无数据状态
    if (!metrics) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">控制台</h1>
                        <p className="text-gray-600">欢迎回来，{currentUser?.name}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                        当前企业：{selectedCompany}
                    </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-center">
                        <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3" />
                        <div>
                            <h3 className="text-lg font-semibold text-yellow-900">暂无数据</h3>
                            <p className="text-yellow-700">当前企业还没有上传财务数据，请先上传数据后再查看工作台。</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">控制台</h1>
                    <p className="text-gray-600">欢迎回来，{currentUser?.name}</p>
                    {metrics.period && (
                        <p className="text-sm text-gray-500 mt-1">
                            数据期间：{metrics.period.display}
                        </p>
                    )}
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                        当前企业：{selectedCompany}
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        刷新
                    </button>
                </div>
            </div>

            {/* 关键指标卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 营业收入 */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">营业收入</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {metrics.revenue?.formatted || '0万'}
                            </p>
                            <div className="flex items-center mt-1">
                                {getTrendIcon(metrics.revenue?.trend)}
                                <span className={getTrendColor(metrics.revenue?.trend, metrics.revenue?.yoyGrowth)}>
                                    {metrics.revenue?.yoyGrowth >= 0 ? '+' : ''}{metrics.revenue?.yoyGrowth?.toFixed(1) || 0}%
                                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BarChart3 className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                {/* 净利润 */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">净利润</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {metrics.netProfit?.formatted || '0万'}
                            </p>
                            <div className="flex items-center mt-1">
                                {getTrendIcon(metrics.netProfit?.trend)}
                                <span className={getTrendColor(metrics.netProfit?.trend, metrics.netProfit?.yoyGrowth)}>
                                    {metrics.netProfit?.yoyGrowth >= 0 ? '+' : ''}{metrics.netProfit?.yoyGrowth?.toFixed(1) || 0}%
                                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                {/* 税负率 */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">税负率</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {metrics.taxBurdenRate?.formatted || '0%'}
                            </p>
                            <div className="flex items-center mt-1">
                                {getTrendIcon(metrics.taxBurdenRate?.trend)}
                                <span className={getTrendColor(metrics.taxBurdenRate?.trend, metrics.taxBurdenRate?.change)}>
                                    {metrics.taxBurdenRate?.change >= 0 ? '+' : ''}{metrics.taxBurdenRate?.change?.toFixed(2) || 0}%
                                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <PieChart className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                {/* 员工人数 */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">员工人数</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {metrics.employeeCount?.value || 0}人
                            </p>
                            <div className="flex items-center mt-1">
                                {getTrendIcon(metrics.employeeCount?.trend)}
                                <span className={getTrendColor(metrics.employeeCount?.trend, metrics.employeeCount?.change)}>
                                    {metrics.employeeCount?.change >= 0 ? '+' : ''}{metrics.employeeCount?.change || 0}人
                                </span>
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
                    {systemStatus ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    {getStatusIcon(systemStatus.dataSync?.status)}
                                    <span className="text-sm text-gray-700">数据同步</span>
                                </div>
                                <span className={`text-sm ${getStatusColor(systemStatus.dataSync?.status)}`}>
                                    {systemStatus.dataSync?.message || '未知'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    {getStatusIcon(systemStatus.systemHealth?.status)}
                                    <span className="text-sm text-gray-700">系统运行</span>
                                </div>
                                <span className={`text-sm ${getStatusColor(systemStatus.systemHealth?.status)}`}>
                                    {systemStatus.systemHealth?.message || '未知'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    {getStatusIcon(systemStatus.dataIntegrity?.status)}
                                    <span className="text-sm text-gray-700">数据完整性</span>
                                </div>
                                <span className={`text-sm ${getStatusColor(systemStatus.dataIntegrity?.status)}`}>
                                    {systemStatus.dataIntegrity?.message || '未知'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    {getStatusIcon(systemStatus.security?.status)}
                                    <span className="text-sm text-gray-700">安全状态</span>
                                </div>
                                <span className={`text-sm ${getStatusColor(systemStatus.security?.status)}`}>
                                    {systemStatus.security?.message || '未知'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">加载中...</p>
                    )}
                </div>
            </div>

            {/* 最近活动 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h3>
                {activities && activities.length > 0 ? (
                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900">{activity.description}</p>
                                    <p className="text-xs text-gray-500">{activity.relativeTime}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">暂无活动记录</p>
                )}
            </div>

            {lastRefresh && (
                <div className="text-xs text-gray-400 text-right">
                    最后更新：{lastRefresh.toLocaleTimeString()}
                </div>
            )}
        </div>
    );
};

export default Dashboard;