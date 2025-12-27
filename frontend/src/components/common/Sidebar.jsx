import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, sidebarItems, userType }) => {
    return (
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 h-screen overflow-y-auto">
            <nav className="p-4 space-y-2">
                {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                                isActive 
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                    : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                            <span className="font-medium">{item.name}</span>
                            {item.badge && (
                                <span className="ml-auto px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;