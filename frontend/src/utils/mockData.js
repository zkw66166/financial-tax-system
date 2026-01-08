import { LayoutDashboard, User, Database, BarChart3, Settings, MessageCircle } from 'lucide-react';

// 企业用户侧边栏菜单
export const sidebarItems = [
    {
        id: 'dashboard',
        name: '工作台',
        icon: LayoutDashboard
    },
    {
        id: 'ai-chat',
        name: 'AI智问',
        icon: MessageCircle
    },
    {
        id: 'profile',
        name: '企业画像',
        icon: BarChart3
    },
    {
        id: 'data',
        name: '数据管理',
        icon: Database
    },
    {
        id: 'settings',
        name: '系统设置',
        icon: Settings
    }
];

// 专业用户（事务所/集团）侧边栏菜单
export const professionalSidebarItems = [
    {
        id: 'dashboard',
        name: '工作台',
        icon: LayoutDashboard
    },
    {
        id: 'ai-chat',
        name: 'AI智问',
        icon: MessageCircle
    },
    {
        id: 'data',
        name: '数据管理',
        icon: Database
    },
    {
        id: 'profile',
        name: '企业画像',
        icon: BarChart3
    },
    {
        id: 'settings',
        name: '系统设置',
        icon: Settings
    }
];

// 模拟管理的企业数据
export const managedCompanies = [
    {
        id: 1,
        name: '北京科技有限公司',
        taxCode: '91110000123456789X',
        industry: '软件开发',
        scale: '中型'
    },
    {
        id: 2,
        name: '上海贸易股份公司',
        taxCode: '91310000987654321A',
        industry: '批发零售',
        scale: '大型'
    },
    {
        id: 3,
        name: '广州制造企业',
        taxCode: '91440000456789123B',
        industry: '制造业',
        scale: '中型'
    }
];