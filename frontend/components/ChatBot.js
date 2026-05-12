import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "👋 እንኳን ደህና መጡ ወደ Abbaa Carraa Ethio! | Welcome to Abbaa Carraa Ethio!\n\n💚 I'm your assistant. Ask me anything about our prize platform!\n\nእንዴት ልረዳዎት እችላለሁ?", sender: "bot", timestamp: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    scrollToBottom();
  }, [messages, isClient]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Your existing knowledgeBase and intentMap here (keep as is)
  const knowledgeBase = {
    // ... your existing knowledgeBase content
  };

  const intentMap = [
    // ... your existing intentMap content
  ];

  const getResponse = (userInput) => {
    // ... your existing getResponse logic
    return "💚 I'm here to help!";
  };

  const handleSend = async () => {
    if (!input.trim() || !isClient) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: "user", timestamp: new Date() }]);
    setInput("");
    setIsTyping(true);
    
    setTimeout(() => {
      const response = getResponse(userMessage);
      setMessages(prev => [...prev, { text: response, sender: "bot", timestamp: new Date() }]);
      setIsTyping(false);
    }, 600);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const quickQuestions = [
    { text: "How to create a pool?", emoji: "📦" },
    { text: "How does commission work?", emoji: "💰" },
    { text: "What is cash policy?", emoji: "💵" },
    { text: "How to become an agent?", emoji: "🤝" },
    { text: "Payment methods?", emoji: "💳" },
    { text: "2% charity?", emoji: "💚" }
  ];

  if (!isClient) {
    return null;
  }

  return (
    // ... your existing JSX (keep as is)
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 bg-gradient-to-r from-green-600 to-teal-600 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 left-4 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  <span className="text-xl">💚</span>
                  <span>Abbaa Carraa Assistant</span>
                </h3>
                <p className="text-xs opacity-90 flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                  Online • እንዴት ልረዳዎት እችላለሁ?
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] rounded-2xl p-3 ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white' 
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  <p className={`text-xs mt-1.5 ${msg.sender === 'user' ? 'text-green-100' : 'text-gray-400'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="border-t border-gray-100 p-3 bg-gray-50">
            <p className="text-xs text-gray-400 mb-2">✨ Suggested questions:</p>
            <div className="flex flex-wrap gap-1.5">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q.text)}
                  className="text-xs bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 rounded-full px-2.5 py-1.5 transition whitespace-nowrap"
                >
                  {q.emoji} {q.text}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t p-3 flex gap-2 bg-white">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question... | ጥያቄዎን ይጻፉ..."
              className="flex-1 p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none"
              rows={1}
              style={{ maxHeight: '80px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-5 py-2 rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Send
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </>
  );
}
