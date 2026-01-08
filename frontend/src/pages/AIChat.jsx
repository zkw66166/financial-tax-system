import React, { useState } from 'react';
import { MessageCircle, Send, Upload, Paperclip, Sparkles } from 'lucide-react';
import { getAIAnswer } from '../utils/aiService';

const AIChat = () => {
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!question.trim()) {
            return;
        }

        // 添加用户问题到消息列表
        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: question,
            timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setQuestion('');

        try {
            // 调用AI API获取回答
            const result = await getAIAnswer(question);

            const aiMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: result.answer,
                timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('AI回答错误:', error);

            const errorMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: 'API调用失败，请稍后重试。错误信息：' + (error.message || '未知错误'),
                timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = () => {
        alert('文件上传功能暂未开放');
    };

    const handleVoiceInput = () => {
        alert('语音输入功能暂未开放');
    };

    return (
        <div className="max-w-5xl mx-auto h-[calc(100vh-200px)] flex flex-col">
            {/* 页面标题 */}
            <div className="mb-6">
                <div className="flex items-center space-x-2">
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">AI智能问答</h1>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">在线</span>
                </div>
                <p className="text-gray-600 mt-1">请详细描述您的问题</p>
            </div>

            {/* 消息区域 */}
            <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
                {/* 消息列表 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Sparkles className="h-16 w-16 mb-4" />
                            <p className="text-lg">开始您的智能咨询</p>
                            <p className="text-sm mt-2">例如：我公司是软件企业，将了解发票用于开发的固体资料中的报税问题，需要信息哪些材料？</p>
                        </div>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-lg px-4 py-3 ${message.type === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-900'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                            {message.timestamp}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                                        <div className="flex space-x-2">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* 输入区域 */}
                <div className="border-t bg-gray-50 p-4">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* 文本输入框 */}
                        <div className="relative">
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="例如：我公司是软件企业，将了解发票用于开发的固体资料中的报税问题，需要信息哪些材料？"
                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows="3"
                                maxLength={500}
                            />
                            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                                {question.length}/500字符
                            </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={handleFileUpload}
                                    className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Upload className="h-4 w-4" />
                                    <span className="text-sm">上传文档</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleVoiceInput}
                                    className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Paperclip className="h-4 w-4" />
                                    <span className="text-sm">语音输入</span>
                                </button>
                            </div>

                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">
                                    支持自然语言、语音对话
                                </span>
                                <button
                                    type="submit"
                                    disabled={!question.trim() || isLoading}
                                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send className="h-4 w-4" />
                                    <span>提交咨询</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* 底部提示 */}
            <div className="mt-4 text-center text-xs text-gray-500">
                <p>AI 智能问答基于大语言模型，回答仅供参考，具体以相关法律法规为准</p>
            </div>
        </div>
    );
};

export default AIChat;
