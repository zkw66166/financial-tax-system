import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Upload, Paperclip, Sparkles, Copy, Check } from 'lucide-react';
import { getAIAnswerStream } from '../utils/aiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AIChat = () => {
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const messagesEndRef = useRef(null);
    const cancelStreamRef = useRef(null);

    // 自动滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingContent]);

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
        setStreamingContent('');
        setQuestion('');

        try {
            // 调用流式 API
            cancelStreamRef.current = getAIAnswerStream(
                question.trim(),
                // onContent - 接收流式内容
                (content) => {
                    console.log('[AIChat] Received content:', content);
                    setStreamingContent(prev => {
                        const newContent = prev + content;
                        console.log('[AIChat] Updated streamingContent, total length:', newContent.length);
                        return newContent;
                    });
                },
                // onComplete - 完成时
                (result) => {
                    const aiMessage = {
                        id: Date.now() + 1,
                        type: 'ai',
                        content: result.answer,
                        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                        policies: result.policies || []
                    };

                    setMessages(prev => [...prev, aiMessage]);
                    setStreamingContent('');
                    setIsLoading(false);
                },
                // onError - 错误时
                (error) => {
                    console.error('AI回答错误:', error);

                    const errorMessage = {
                        id: Date.now() + 1,
                        type: 'ai',
                        content: 'API调用失败，请稍后重试。错误信息：' + (error.message || '未知错误'),
                        timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                        isError: true
                    };

                    setMessages(prev => [...prev, errorMessage]);
                    setStreamingContent('');
                    setIsLoading(false);
                }
            );

        } catch (error) {
            console.error('提交错误:', error);
            setIsLoading(false);
            setStreamingContent('');
        }
    };

    const handleCopy = (content, messageId) => {
        navigator.clipboard.writeText(content).then(() => {
            setCopiedId(messageId);
            setTimeout(() => setCopiedId(null), 2000);
        });
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
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Coze知识库</span>
                </div>
                <p className="text-gray-600 mt-1">基于专业税务财务知识库的智能问答</p>
            </div>

            {/* 消息区域 */}
            <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
                {/* 消息列表 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Sparkles className="h-16 w-16 mb-4" />
                            <p className="text-lg">开始您的智能咨询</p>
                            <p className="text-sm mt-2">例如：我公司是软件企业,需要了解研发费用加计扣除政策</p>
                        </div>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg px-4 py-3 ${message.type === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : message.isError
                                                ? 'bg-red-50 text-red-900 border border-red-200'
                                                : 'bg-gray-50 text-gray-900 border border-gray-200'
                                            }`}
                                    >
                                        {message.type === 'user' ? (
                                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        ) : (
                                            <div className="prose prose-sm max-w-none">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        // 自定义代码块样式
                                                        code({ node, inline, className, children, ...props }) {
                                                            return inline ? (
                                                                <code className="bg-gray-200 px-1 py-0.5 rounded text-sm" {...props}>
                                                                    {children}
                                                                </code>
                                                            ) : (
                                                                <code className="block bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto" {...props}>
                                                                    {children}
                                                                </code>
                                                            );
                                                        },
                                                        // 自定义表格样式
                                                        table({ children }) {
                                                            return <table className="border-collapse border border-gray-300 w-full">{children}</table>;
                                                        },
                                                        th({ children }) {
                                                            return <th className="border border-gray-300 px-2 py-1 bg-gray-100">{children}</th>;
                                                        },
                                                        td({ children }) {
                                                            return <td className="border border-gray-300 px-2 py-1">{children}</td>;
                                                        }
                                                    }}
                                                >
                                                    {message.content}
                                                </ReactMarkdown>

                                                {/* 政策法规标签 */}
                                                {message.policies && message.policies.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <p className="text-xs text-gray-500 mb-2">相关政策法规：</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {message.policies.map((policy, idx) => (
                                                                <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                                    {policy}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 复制按钮 */}
                                                {!message.isError && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
                                                        <button
                                                            onClick={() => handleCopy(message.content, message.id)}
                                                            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                                                        >
                                                            {copiedId === message.id ? (
                                                                <>
                                                                    <Check className="h-3 w-3" />
                                                                    <span>已复制</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="h-3 w-3" />
                                                                    <span>复制回答</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                                            }`}>
                                            {message.timestamp}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* 流式内容显示 */}
                            {isLoading && streamingContent && (
                                <div className="flex justify-start">
                                    <div className="max-w-[80%] bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                                        <div className="prose prose-sm max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {streamingContent}
                                            </ReactMarkdown>
                                        </div>
                                        <div className="flex items-center space-x-1 mt-2">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 加载指示器（无内容时） */}
                            {isLoading && !streamingContent && (
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
                            <div ref={messagesEndRef} />
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
                                placeholder="例如：我公司是软件企业,需要了解研发费用加计扣除政策"
                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows="3"
                                maxLength={500}
                                disabled={isLoading}
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
                                    disabled={isLoading}
                                    className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <Upload className="h-4 w-4" />
                                    <span className="text-sm">上传文档</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleVoiceInput}
                                    disabled={isLoading}
                                    className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <Paperclip className="h-4 w-4" />
                                    <span className="text-sm">语音输入</span>
                                </button>
                            </div>

                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">
                                    支持自然语言、流式响应
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
                <p>AI 智能问答基于 Coze 知识库，回答仅供参考，具体以相关法律法规为准</p>
            </div>
        </div>
    );
};

export default AIChat;
