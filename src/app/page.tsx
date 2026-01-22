'use client';
import { useState, useRef, useEffect } from 'react';

type Message = { role: 'user' | 'assistant'; content: string; };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('googleai/gemini-2.5-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      alert('Error connecting to agent.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gray-900 text-white">
      <div className="w-full max-w-2xl mb-8 text-center mt-10">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">Gemini Clone</h1>
        <p className="text-gray-400 mb-4">Clean Architecture • RAG • Tools</p>

        <div className="flex justify-center">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="googleai/gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gpt-5-nano">GPT-5 Nano (OpenAI)</option>
          </select>
        </div>
      </div>

      <div className="flex-1 w-full max-w-2xl bg-gray-800 rounded-xl border border-gray-700 p-4 mb-4 overflow-y-auto h-[60vh] shadow-2xl">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 italic">Start a conversation...</div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${m.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {isLoading && <div className="text-gray-400 animate-pulse">Gemini is thinking (Checking Tools)...</div>}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl flex gap-2">
        <input
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the weather or the RAG paper..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50">Send</button>
      </form>
    </main>
  );
}
