'use client';
import { useState, useRef, useEffect } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

// Mock data for sidebar chats
const mockChats = [
  { id: '1', title: 'RAG Architecture Discussion', date: 'Today' },
  { id: '2', title: 'Web Search Integration', date: 'Today' },
  { id: '3', title: 'Clean Architecture Patterns', date: 'Yesterday' },
  { id: '4', title: 'TypeScript Best Practices', date: 'Yesterday' },
  { id: '5', title: 'Gemini API Setup', date: 'Last week' },
];

// Available tools
const availableTools = [
  { id: 'web_search', name: 'Web Search', icon: '🔍', enabled: true },
  { id: 'knowledge_base', name: 'Knowledge Base', icon: '📚', enabled: true },
];

// Available models
const models = [
  { id: 'googleai/gemini-2.5-flash', name: 'Gemini 2.5', icon: '✨' },
  { id: 'gpt-5-nano', name: 'GPT-4o', icon: '🤖' },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('googleai/gemini-2.5-flash');
  const [enabledTools, setEnabledTools] = useState<string[]>(['web_search', 'knowledge_base']);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
        setShowToolsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          conversationId: conversationId,
          modelId: selectedModel,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      if (data.id) setConversationId(data.id);

      const aiMessage: Message = { role: 'assistant', content: data.content };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error connecting to agent. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTool = (toolId: string) => {
    setEnabledTools((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setActiveChat(null);
  };

  const selectedModelObj = models.find((m) => m.id === selectedModel);

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden flex flex-col`}
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-subtle)' }}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <h1 className="text-lg font-semibold gradient-text">Gemini Clone</h1>
          <button
            onClick={startNewChat}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            title="New Chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto py-2">
          {mockChats.map((chat, index) => (
            <div key={chat.id}>
              {index === 0 || mockChats[index - 1].date !== chat.date ? (
                <div className="px-4 py-2 text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {chat.date}
                </div>
              ) : null}
              <button
                onClick={() => setActiveChat(chat.id)}
                className={`chat-item w-full text-left px-4 py-3 ${activeChat === chat.id ? 'active' : ''}`}
              >
                <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{chat.title}</p>
              </button>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-sm font-medium">
              M
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Marco Lopez</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Developer</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="h-14 flex items-center px-4 gap-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {messages.length === 0 ? 'New Conversation' : `${messages.length} messages`}
          </span>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="text-6xl mb-6">✨</div>
                <h2 className="text-2xl font-semibold mb-2 gradient-text">How can I help you today?</h2>
                <p className="text-sm max-w-md" style={{ color: 'var(--text-muted)' }}>
                  Ask me anything about RAG, search the web for real-time info, or explore the knowledge base.
                </p>

                {/* Quick Actions */}
                <div className="flex gap-3 mt-8 flex-wrap justify-center">
                  {[
                    { icon: '📚', text: 'What is Modular RAG?' },
                    { icon: '🔍', text: 'Latest AI news' },
                    { icon: '💡', text: 'Explain Clean Architecture' },
                  ].map((action, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(action.text)}
                      className="px-4 py-2 rounded-xl text-sm hover-lift"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
                    >
                      <span className="mr-2">{action.icon}</span>
                      {action.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'message-user' : 'message-assistant'}`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="message-assistant rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-shimmer h-4 w-24 rounded"></div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area - Gemini Style */}
        <div className="p-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}
              >
                {/* Text Input */}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Ask Gemini Clone..."
                  disabled={isLoading}
                  rows={1}
                  className="w-full bg-transparent px-4 py-4 resize-none focus:outline-none text-sm"
                  style={{ color: 'var(--text-primary)', minHeight: '56px', maxHeight: '200px' }}
                />

                {/* Bottom Bar */}
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{ borderTop: '1px solid var(--border-subtle)' }}
                >
                  {/* Left: Tools */}
                  <div className="flex items-center gap-2">
                    {/* Add attachment button */}
                    <button
                      type="button"
                      className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>

                    {/* Tools Dropdown */}
                    <div className="relative" ref={toolsDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-sm"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Tools</span>
                        <span className="tool-badge px-1.5 py-0.5 rounded text-xs">{enabledTools.length}</span>
                      </button>

                      {showToolsDropdown && (
                        <div
                          className="absolute bottom-full left-0 mb-2 w-56 rounded-xl shadow-xl overflow-hidden"
                          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                        >
                          <div className="p-2">
                            <p className="px-3 py-2 text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                              Available Tools
                            </p>
                            {availableTools.map((tool) => (
                              <button
                                key={tool.id}
                                type="button"
                                onClick={() => toggleTool(tool.id)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                              >
                                <span className="text-lg">{tool.icon}</span>
                                <span className="flex-1 text-left text-sm">{tool.name}</span>
                                <div
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${enabledTools.includes(tool.id)
                                      ? 'bg-emerald-500 border-emerald-500'
                                      : 'border-gray-500'
                                    }`}
                                >
                                  {enabledTools.includes(tool.id) && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Model Selector + Send */}
                  <div className="flex items-center gap-2">
                    {/* Model Selector */}
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="appearance-none bg-transparent px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-[var(--bg-hover)] transition-colors focus:outline-none"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {models.map((model) => (
                        <option key={model.id} value={model.id} style={{ background: 'var(--bg-secondary)' }}>
                          {model.icon} {model.name}
                        </option>
                      ))}
                    </select>

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="p-2 rounded-lg transition-all disabled:opacity-30"
                      style={{
                        background: input.trim() ? 'var(--accent-primary)' : 'transparent',
                        color: input.trim() ? 'white' : 'var(--text-muted)',
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              Gemini Clone may display inaccurate info. Verify important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
