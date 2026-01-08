import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AIChat from './pages/AIChat';
import Profile from './components/pages/Profile';
import DataManagement from './components/pages/DataManagement';
import Settings from './pages/Settings';
import ApiService from './services/api';

import { sidebarItems, professionalSidebarItems } from './utils/mockData';

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedCompany, setSelectedCompany] = useState('示例科技有限公司');
    const [showCompanySelector, setShowCompanySelector] = useState(false);
    const [companySearchTerm, setCompanySearchTerm] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [userType, setUserType] = useState('enterprise');
    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (isLoggedIn) {
            loadCompanies();
        }
    }, [isLoggedIn]);

    const loadCompanies = async () => {
        try {
            const response = await ApiService.getCompanies();
            if (response.success) {
                setCompanies(response.data);
                // 如果当前选择的企业不在列表中，选择第一个企业
                if (!response.data.find(c => c.name === selectedCompany) && response.data.length > 0) {
                    setSelectedCompany(response.data[0].name);
                }
            }
        } catch (error) {
            console.error('加载企业列表失败:', error);
        }
    };

    const handleLogin = (user) => {
        setCurrentUser(user);
        setUserType(user.userType);
        setIsLoggedIn(true);

        if (user.userType === 'enterprise') {
            setActiveTab('dashboard');
        } else {
            setActiveTab('data');
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setUserType('enterprise');
        setActiveTab('dashboard');
        setSelectedCompany('示例科技有限公司');
        setShowCompanySelector(false);
        setCompanySearchTerm('');
    };

    const handleUserTypeChange = (type) => {
        if (currentUser && currentUser.userType !== type) {
            alert('用户类型变更需要管理员审核，请在用户设置中提交申请');
            return;
        }

        setUserType(type);
        setCurrentUser(prev => ({ ...prev, userType: type }));

        if (type === 'enterprise') {
            setActiveTab('dashboard');
        } else {
            setActiveTab('data');
        }
    };

    if (!isLoggedIn) {
        return <Login onLogin={handleLogin} />;
    }

    const isProfessionalUser = userType === 'accounting' || userType === 'group';

    const renderContent = () => {
        const commonProps = {
            selectedCompany,
            userType,
            currentTime,
            currentUser
        };

        switch (activeTab) {
            case 'dashboard':
                return <Dashboard {...commonProps} />;
            case 'ai-chat':
                return <AIChat {...commonProps} />;
            case 'profile':
                return <Profile {...commonProps} />;
            case 'data':
                return <DataManagement {...commonProps} />;
            case 'settings':
                return <Settings {...commonProps} />;
            default:
                return isProfessionalUser ?
                    <DataManagement {...commonProps} /> :
                    <Dashboard {...commonProps} />;
        }
    };

    const currentSidebarItems = isProfessionalUser ? professionalSidebarItems : sidebarItems;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                selectedCompany={selectedCompany}
                setSelectedCompany={setSelectedCompany}
                showCompanySelector={showCompanySelector}
                setShowCompanySelector={setShowCompanySelector}
                companySearchTerm={companySearchTerm}
                setCompanySearchTerm={setCompanySearchTerm}
                currentTime={currentTime}
                userType={userType}
                currentUser={currentUser}
                onLogout={handleLogout}
                companies={companies}
            />

            <div className="flex">
                <Sidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    sidebarItems={currentSidebarItems}
                    userType={userType}
                />

                <main className="flex-1 overflow-auto">
                    <div className="p-6">
                        {renderContent()}
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
};

export default App;