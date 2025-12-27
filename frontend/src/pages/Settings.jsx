import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Shield, Database, Bell } from 'lucide-react';

const Settings = ({ currentUser, userType }) => {
    const [activeSection, setActiveSection] = useState('profile');

    const sections = [
        { id: 'profile', name: '个人资料', icon: User },
        { id: 'security', name: '安全设置', icon: Shield },
        { id: 'data', name: '数据设置', icon: Database },
        { id: 'notifications', name: '通知设置', icon: Bell }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
                <p className="text-gray-600">管理您的账户和系统偏好设置</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 设置导航 */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <nav className="space-y-2">
                            {sections.map((section) => {
                                const Icon = section.icon;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${activeSection === section.id
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{section.name}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* 设置内容 */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        {activeSection === 'profile' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-900">个人资料</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            姓名
                                        </label>
                                        <input
                                            type="text"
                                            defaultValue={currentUser?.name || ''}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            用户类型
                                        </label>
                                        <input
                                            type="text"
                                            value={userType}
                                            disabled
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            公司名称
                                        </label>
                                        <input
                                            type="text"
                                            defaultValue={currentUser?.company || ''}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            邮箱
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="请输入邮箱"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    保存更改
                                </button>
                            </div>
                        )}

                        {activeSection === 'security' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-900">安全设置</h2>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-md font-medium text-gray-900 mb-3">修改密码</h3>
                                        <div className="space-y-3">
                                            <input
                                                type="password"
                                                placeholder="当前密码"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                            <input
                                                type="password"
                                                placeholder="新密码"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                            <input
                                                type="password"
                                                placeholder="确认新密码"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                            更新密码
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'data' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-900">数据设置</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                        <div>
                                            <h3 className="font-medium text-gray-900">自动备份</h3>
                                            <p className="text-sm text-gray-600">自动备份重要数据</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                        <div>
                                            <h3 className="font-medium text-gray-900">数据同步</h3>
                                            <p className="text-sm text-gray-600">与外部系统同步数据</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'notifications' && (
                            <div className="space-y-6">
                                <h2 className="text-lg font-semibold text-gray-900">通知设置</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                        <div>
                                            <h3 className="font-medium text-gray-900">邮件通知</h3>
                                            <p className="text-sm text-gray-600">接收重要更新的邮件通知</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                        <div>
                                            <h3 className="font-medium text-gray-900">系统通知</h3>
                                            <p className="text-sm text-gray-600">接收系统状态和警报通知</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;