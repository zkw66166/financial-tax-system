import React from 'react';
import { Search, Bell, User, LogOut, Building, Clock, ChevronDown } from 'lucide-react';

const Header = ({ 
    selectedCompany, 
    setSelectedCompany, 
    showCompanySelector, 
    setShowCompanySelector,
    companySearchTerm,
    setCompanySearchTerm,
    currentTime,
    userType,
    currentUser,
    onLogout,
    companies = []
}) => {
    const formatTime = (date) => {
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getUserTypeLabel = (type) => {
        switch(type) {
            case 'enterprise': return '企业用户';
            case 'accounting': return '事务所用户';
            case 'group': return '集团用户';
            default: return '用户';
        }
    };

    const filteredCompanies = companies.filter(company => 
        company.name.toLowerCase().includes(companySearchTerm.toLowerCase())
    );

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo和标题 */}
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Building className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">智能财税咨询系统</h1>
                                <p className="text-xs text-gray-500">Enterprise Financial & Tax Intelligence Platform</p>
                            </div>
                        </div>
                    </div>

                    {/* 企业选择器 */}
                    <div className="flex-1 max-w-md mx-8">
                        <div className="relative">
                            <button
                                onClick={() => setShowCompanySelector(!showCompanySelector)}
                                className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center space-x-2">
                                    <Building className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-900 truncate">
                                        {selectedCompany || '选择企业'}
                                    </span>
                                </div>
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            </button>

                            {/* 企业下拉列表 */}
                            {showCompanySelector && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                                    <div className="p-2">
                                        <div className="relative">
                                            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="搜索企业..."
                                                value={companySearchTerm}
                                                onChange={(e) => setCompanySearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {filteredCompanies.length > 0 ? (
                                            filteredCompanies.map((company) => (
                                                <button
                                                    key={company.id}
                                                    onClick={() => {
                                                        setSelectedCompany(company.name);
                                                        setShowCompanySelector(false);
                                                        setCompanySearchTerm('');
                                                    }}
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="text-sm font-medium text-gray-900">{company.name}</div>
                                                    <div className="text-xs text-gray-500">{company.industry}</div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-sm text-gray-500">
                                                暂无企业数据
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 右侧操作区 */}
                    <div className="flex items-center space-x-4">
                        {/* 时间显示 */}
                        <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(currentTime)}</span>
                        </div>

                        {/* 通知 */}
                        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <Bell className="h-5 w-5" />
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                3
                            </span>
                        </button>

                        {/* 用户信息 */}
                        <div className="flex items-center space-x-3">
                            <div className="hidden md:block text-right">
                                <div className="text-sm font-medium text-gray-900">
                                    {currentUser?.name || '用户'}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {getUserTypeLabel(userType)}
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-white" />
                                </div>
                                
                                <button
                                    onClick={onLogout}
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                    title="退出登录"
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;