/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                }
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
            }
        },
    },
    plugins: [],
    safelist: [
        // 确保动态类名不被清除
        'bg-blue-50',
        'bg-blue-100',
        'bg-blue-600',
        'text-blue-600',
        'text-blue-700',
        'border-blue-200',
        'border-blue-500',
        'hover:bg-blue-700',
        'bg-green-50',
        'bg-green-100',
        'bg-green-600',
        'text-green-600',
        'text-green-700',
        'bg-purple-50',
        'bg-purple-100',
        'bg-purple-600',
        'text-purple-600',
        'text-purple-700',
        'bg-orange-50',
        'bg-orange-100',
        'bg-orange-600',
        'text-orange-600',
        'text-orange-700',
        'bg-red-50',
        'bg-red-100',
        'bg-red-600',
        'text-red-600',
        'text-red-700',
        'bg-yellow-50',
        'bg-yellow-100',
        'bg-yellow-600',
        'text-yellow-600',
        'text-yellow-700',
        'bg-indigo-50',
        'bg-indigo-100',
        'bg-indigo-600',
        'text-indigo-600',
        'text-indigo-700',
        'bg-teal-50',
        'bg-teal-100',
        'bg-teal-600',
        'text-teal-600',
        'text-teal-700',
        'bg-pink-50',
        'bg-pink-100',
        'bg-pink-600',
        'text-pink-600',
        'text-pink-700'
    ]
}