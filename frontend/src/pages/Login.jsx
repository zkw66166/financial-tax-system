import React, { useState, useEffect } from 'react';
import { Building, User, Lock, Eye, EyeOff } from 'lucide-react';

const Login = ({ onLogin }) => {
    const [loginForm, setLoginForm] = useState({
        username: 'enterprise',
        password: '123456',
        userType: 'enterprise'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 根据用户类型自动填充用户名和密码
    useEffect(() => {
        const credentials = {
            enterprise: { username: 'enterprise', password: '123456' },
            accounting: { username: 'accounting', password: '123456' },
            group: { username: 'group', password: '123456' }
        };

        const { username, password } = credentials[loginForm.userType];
        setLoginForm(prev => ({
            ...prev,
            username,
            password
        }));
    }, [loginForm.userType]);

    // 模拟用户数据
    const mockUsers = [
        {
            id: 1,
            username: 'enterprise',
            password: '123456',
            name: '张三',
            userType: 'enterprise',
            company: '示例科技有限公司'
        },
        {
            id: 2,
            username: 'accounting',
            password: '123456',
            name: '李四',
            userType: 'accounting',
            company: '华信会计师事务所'
        },
        {
            id: 3,
            username: 'group',
            password: '123456',
            name: '王五',
            userType: 'group',
            company: '鸿运集团有限公司'
        }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 模拟登录验证
            await new Promise(resolve => setTimeout(resolve, 1000));

            const user = mockUsers.find(u =>
                u.username === loginForm.username &&
                u.password === loginForm.password &&
                u.userType === loginForm.userType
            );

            if (user) {
                onLogin(user);
            } else {
                alert('用户名、密码或用户类型错误');
            }
        } catch (error) {
            alert('登录失败，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                {/* Logo和标题 */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Building className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">智能财税咨询系统</h1>
                    <p className="text-gray-600 mt-2">请登录您的账户</p>
                </div>

                {/* 登录表单 */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 用户类型选择 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            用户类型
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'enterprise', label: '企业用户' },
                                { value: 'accounting', label: '事务所' },
                                { value: 'group', label: '集团用户' }
                            ].map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setLoginForm({ ...loginForm, userType: type.value })}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${loginForm.userType === type.value
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 用户名 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            用户名
                        </label>
                        <div className="relative">
                            <User className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                required
                                value={loginForm.username}
                                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="请输入用户名"
                            />
                        </div>
                    </div>

                    {/* 密码 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            密码
                        </label>
                        <div className="relative">
                            <Lock className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="请输入密码"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* 登录按钮 */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? '登录中...' : '登录'}
                    </button>
                </form>

                {/* 测试账号提示 */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">测试账号：</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                        <p>企业用户: enterprise / 123456</p>
                        <p>事务所用户: accounting / 123456</p>
                        <p>集团用户: group / 123456</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;