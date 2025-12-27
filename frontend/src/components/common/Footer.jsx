import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-gray-200 py-4 px-6">
            <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                    © 2024 智能财税咨询系统. All rights reserved.
                </div>
                <div className="flex items-center space-x-4">
                    <span>版本 v1.0.0</span>
                    <span>|</span>
                    <a href="#" className="hover:text-blue-600 transition-colors">帮助中心</a>
                    <span>|</span>
                    <a href="#" className="hover:text-blue-600 transition-colors">技术支持</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;