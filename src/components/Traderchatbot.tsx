import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export default function TraderChatBot() {
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const { theme } = useTheme();

  // Loading animation states
  const loadingStates = [
    'Analyzing market data...',
    'Fetching real-time prices...',
    'Processing technical indicators...',
    'Generating insights...',
    'Almost ready...'
  ];

  // Clear conversation history on page reload
  useEffect(() => {
    setMessages([]);
  }, []);

  const clearChat = () => {
    setMessages([]);
  };

  // Clean AI response by removing thinking texts and disclaimers
  const cleanResponse = (response: string): string => {
    // Remove text inside <think></think> tags
    let cleaned = response.replace(/<think>[\s\S]*?<\/think>/g, '');
    
    // Remove common thinking patterns
    cleaned = cleaned
      .replace(/^(Let me|I'll|I will|Based on|According to|Looking at).*?\.\s*/gi, '')
      .replace(/^(As a|I am a|You are).*?\.\s*/gi, '')
      .replace(/^(Please note|Remember|Keep in mind|It's important).*?\.\s*/gi, '')
      .replace(/^(This is|Here is|Here's).*?\.\s*/gi, '')
      .replace(/^(The data shows|The market shows|Current data).*?\.\s*/gi, '')
      .replace(/^(For|Regarding|About).*?:\s*/gi, '')
      .replace(/^(Disclaimer|Note|Warning).*?\.\s*/gi, '')
      .replace(/^(Always|Remember to|Make sure to).*?\.\s*/gi, '')
      .replace(/^(In conclusion|To summarize|Overall).*?\.\s*/gi, '')
      .replace(/^(The current|Current|Today's).*?price.*?is\s*/gi, '')
      .replace(/^(Bitcoin|BTC|Ethereum|ETH).*?is.*?trading.*?at\s*/gi, '')
      .replace(/^(Price|Value|Cost).*?:\s*/gi, '')
      .replace(/^(Market cap|Volume|Change).*?:\s*/gi, '')
      .trim();

    // If response is too short after cleaning, use original
    if (cleaned.length < 10) {
      cleaned = response.trim();
    }

    return cleaned;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    
    // Add user message to UI immediately
    const updatedMessages = [...messages, { role: 'user', content: input }];
    setMessages(updatedMessages);
    
    // Start loading animation
    let loadingIndex = 0;
    const loadingInterval = setInterval(() => {
      setLoadingText(loadingStates[loadingIndex % loadingStates.length]);
      loadingIndex++;
    }, 800);

    // Add loading message
    const loadingMessageId = Date.now();
    setMessages(prev => [...prev, { role: 'assistant', content: loadingStates[0] }]);
    
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          conversationHistory: messages
        }),
      });
      
      if (!res.ok) throw new Error('Network response was not ok');
      
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        data = { reply: 'Sorry, there was an error processing the response.' };
        console.log(jsonErr);
      }
      
      // Clean the response
      const cleanedReply = cleanResponse(data.reply);
      
      // Replace loading message with final response
      setMessages(prev => 
        prev.map((msg, index) => 
          index === prev.length - 1 && msg.role === 'assistant' 
            ? { role: 'assistant', content: cleanedReply }
            : msg
        )
      );
      
    } catch (err) {
      // Replace loading message with error
      setMessages(prev => 
        prev.map((msg, index) => 
          index === prev.length - 1 && msg.role === 'assistant' 
            ? { role: 'assistant', content: 'Sorry, there was an error processing your request.' }
            : msg
        )
      );
    } finally {
      clearInterval(loadingInterval);
      setLoadingText('');
      setInput('');
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full h-full rounded-xl shadow-lg border p-6"
      style={{
        background: theme === 'dark' ? 'rgba(30, 63, 32, 0.95)' : '#f8faf8',
        borderColor: theme === 'dark' ? '#4a7c59' : '#b0d7b8',
        color: theme === 'dark' ? '#fff' : '#1A1F16',
        minHeight: '600px',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(10px)',
        boxShadow: theme === 'dark' 
          ? '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(74, 124, 89, 0.2)' 
          : '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(176, 215, 184, 0.3)'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b" style={{
        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
      }}>
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full" style={{
            background: theme === 'dark' ? '#76ba94' : '#4a7c59'
          }}></div>
          <h3 className="text-xl font-bold" style={{ 
            color: theme === 'dark' ? '#76ba94' : '#2d5a31',
            textShadow: theme === 'dark' ? '0 0 10px rgba(118, 186, 148, 0.3)' : 'none'
          }}>
            Trader AI Assistant
          </h3>
          <div className="flex space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 text-sm font-medium"
          style={{
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, #4a7c59 0%, #76ba94 100%)' 
              : 'linear-gradient(135deg, #76ba94 0%, #4a7c59 100%)',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          Clear Chat
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-4 px-2" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: theme === 'dark' ? '#4a7c59 #1a1a1a' : '#b0d7b8 #f0f0f0'
      }}>
        {messages.length === 0 && (
          <div className="text-center py-12 opacity-60">
            <div className="text-6xl mb-4">🤖</div>
            <p className="text-lg font-medium mb-2">Welcome to your Trading Assistant</p>
            <p className="text-sm">Ask me about market prices, technical analysis, or trading insights</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg transition-all duration-200 ${
                msg.role === 'user'
                  ? 'ml-auto'
                  : 'mr-auto'
              }`}
              style={{
                background: msg.role === 'user'
                  ? theme === 'dark'
                    ? 'linear-gradient(135deg, #2d5a31 0%, #4a7c59 100%)'
                    : 'linear-gradient(135deg, #76ba94 0%, #4a7c59 100%)'
                  : theme === 'dark'
                    ? 'rgba(255,255,255,0.08)'
                    : '#ffffff',
                color: theme === 'dark' ? '#fff' : '#1A1F16',
                border: msg.role === 'user' 
                  ? '1px solid rgba(255,255,255,0.1)'
                  : theme === 'dark'
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid rgba(176, 215, 184, 0.3)',
                boxShadow: msg.role === 'user'
                  ? '0 8px 25px rgba(0,0,0,0.2)'
                  : '0 4px 15px rgba(0,0,0,0.1)',
                opacity: loading && i === messages.length - 1 && msg.role === 'assistant' ? 0.7 : 1
              }}
            >
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{
                  background: msg.role === 'user' 
                    ? 'rgba(255,255,255,0.2)' 
                    : theme === 'dark' ? '#4a7c59' : '#76ba94',
                  color: '#fff'
                }}>
                  {msg.role === 'user' ? 'U' : 'AI'}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium mb-1 opacity-70">
                    {msg.role === 'user' ? 'You' : 'Trading Assistant'}
                  </div>
                  <div className="text-sm leading-relaxed">
                    {msg.content}
                    {loading && i === messages.length - 1 && msg.role === 'assistant' && (
                      <span className="ml-1 inline-block">
                        <span className="animate-pulse">●</span>
                        <span className="animate-pulse" style={{animationDelay: '0.2s'}}>●</span>
                        <span className="animate-pulse" style={{animationDelay: '0.4s'}}>●</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Section */}
      <div className="border-t pt-4" style={{
        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
      }}>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
              placeholder={loading ? "Processing your request..." : "Ask about market prices, technical analysis, or trading insights..."}
              className="w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                              style={{
                  borderColor: theme === 'dark' ? '#4a7c59' : '#b0d7b8',
                  background: theme === 'dark' ? 'rgba(26, 31, 22, 0.8)' : '#fff',
                  color: theme === 'dark' ? '#fff' : '#1A1F16',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              disabled={loading}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-current" style={{
                  borderTopColor: theme === 'dark' ? '#76ba94' : '#4a7c59'
                }}></div>
              </div>
            )}
          </div>
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: loading || !input.trim() 
                ? (theme === 'dark' ? '#2d5a31' : '#b0d7b8')
                : theme === 'dark'
                  ? 'linear-gradient(135deg, #4a7c59 0%, #76ba94 100%)'
                  : 'linear-gradient(135deg, #76ba94 0%, #4a7c59 100%)',
              color: '#fff',
              boxShadow: loading || !input.trim() 
                ? 'none'
                : '0 8px 25px rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-white"></div>
                <span>Processing</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Send</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            )}
          </button>
        </div>
        <div className="text-xs text-center mt-3 opacity-60">
          Press Enter to send • Real-time market data from Bybit
        </div>
      </div>
    </div>
  );
}