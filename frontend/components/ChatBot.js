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

  const knowledgeBase = {
    // General
    "how to create a pool": "📦 To create a pool:\n1. Login to your account\n2. Click 'Create Pool' button\n3. Enter prize name, target amount, and entry fee\n4. Upload an image (optional)\n5. Set end date\n6. Click 'Create Prize Pool'\n\nNote: Admins get 20% commission, Agents/Orgs get 10% commission.",
    "create pool": "📦 To create a pool, go to the 'Create Pool' page from your dashboard. You'll need:\n- Prize/Product name\n- Description\n- Target amount (Winner gets this)\n- Entry fee per seat\n- End date\n\nTotal collected = Target + Commission (10-20%) + Platform fee (10%)",
    
    // Commission
    "how does commission work": "💰 Commission Structure:\n\n• Admin personal pools: 20% commission\n• Agent pools: 10% commission + 10% platform fee\n• Organization pools: 10% commission + 10% platform fee\n• Vendor sales: 10% commission + 10% platform fee\n• Individual participants: No commission\n\nWinner always gets 100% of target amount!",
    "commission": "💰 Commission rates:\n• Admin: 20%\n• Agent: 10%\n• Organization: 10%\n• Vendor: 10%\n• Platform fee (agent/org/vendor): 10%",
    
    // Cash Policy
    "what is cash policy": "💵 Cash Equivalent Guarantee:\n\nIf you win a prize pool and the physical product is unavailable, you will receive the FULL cash equivalent of the target amount. Paid within 14 days of draw completion via Telebirr or bank transfer.",
    "cash guarantee": "💵 100% Cash Equivalent Guarantee!\nWinner gets either the actual product OR full cash value. No questions asked.",
    "cash policy": "💵 Cash Equivalent Guarantee ensures winners always receive value - either the physical prize or cash.",
    
    // Become Agent
    "how to become an agent": "🤝 To become an Agent:\n1. Click 'Become an Agent' on the homepage\n2. Fill out the application form\n3. Submit your business details\n4. Wait for admin approval (24-48 hours)\n5. Once approved, you can create pools and earn 10% commission!",
    "become agent": "🤝 Apply to become an agent through the 'Become an Agent' page. You'll earn 10% commission on pools you create.",
    "agent": "🤝 Agents create prize pools and earn 10% commission. Apply through the 'Become an Agent' page.",
    
    // Become Vendor
    "how to become a vendor": "🏪 To become a Vendor:\n1. Click 'Become a Vendor' on the homepage\n2. Complete the registration form\n3. Submit your business license\n4. Wait for verification\n5. Once verified, list your products and earn 10% commission on sales!",
    "become vendor": "🏪 Vendors list products for pool winners to purchase. Earn 10% commission on each sale. Apply through the 'Become a Vendor' page.",
    "vendor": "🏪 Vendors earn 10% commission when pool winners purchase their products.",
    
    // Become Organization
    "how to become an organization": "🏢 To become an Organization:\n1. Click 'Become an Organization' on the homepage\n2. Fill out the organization registration\n3. Provide business documents\n4. Wait for verification\n5. Create private pools for your members and earn 10% commission!",
    "become organization": "🏢 Organizations create private pools for their members. Earn 10% commission. Apply through the 'Become an Organization' page.",
    "organization": "🏢 Organizations create private pools for members and earn 10% commission.",
    
    // Payment Methods
    "payment methods": "💳 Accepted Payment Methods:\n• Telebirr\n• CBE Birr\n• Bank Transfer\n• Cash at Agent Locations\n\nAll payments are secure and verified.",
    "how to pay": "💳 You can pay via Telebirr, CBE Birr, bank transfer, or cash at authorized agent locations.",
    "telebirr": "📱 Telebirr is accepted. Simply select Telebirr at checkout and follow the prompts.",
    
    // Charity
    "2% charity": "💚 2% of every contribution supports kidney and heart disease patients in Ethiopia. Your participation helps save lives!",
    "charity": "💚 We donate 2% of all platform income to support kidney and heart disease treatment. Every pool gives hope!",
    "heart disease": "💚 2% of proceeds go to heart disease and kidney treatment. You're not just winning - you're helping save lives!",
    "kidney": "💚 2% supports kidney disease treatment. Every contribution makes a difference!",
    
    // How to Win
    "how to win": "🏆 To win:\n1. Find an active pool you want to join\n2. Pay the entry fee\n3. Get your seat/ticket\n4. Wait for the pool to reach target\n5. Winner is randomly selected by our verifiable system\n6. Winner announced and notified immediately!\n\nMore entries = higher chance to win!",
    "winning": "🏆 Winners are selected randomly when a pool reaches its target. The draw is transparent and verifiable.",
    "winner selection": "🏆 Random draw from all participants when pool target is reached. Results are immediate and transparent.",
    
    // Registration
    "how to register": "📝 To register:\n1. Click 'Register' on the homepage\n2. Choose your role (Individual/Agent/Vendor/Organization)\n3. Sign in with Google\n4. Accept the Terms & Conditions\n5. Complete your profile\n6. Start participating!",
    "sign up": "📝 Click 'Register' on the homepage, choose your role, and sign in with Google. It's free!",
    "register": "📝 Registration is free! Choose your role and sign in with Google.",
    
    // Login
    "how to login": "🔑 Click 'Login' on the top right corner, then sign in with your Google account.",
    "login": "🔑 Use the 'Login' button and sign in with Google.",
    
    // Withdrawal
    "how to withdraw": "💸 To withdraw your earnings:\n1. Go to your dashboard\n2. Click 'Withdraw Earnings'\n3. Enter amount (minimum 100 ETB)\n4. Submit request\n5. Approved within 2-3 business days\n6. Funds sent to your Telebirr account",
    "withdraw": "💸 Minimum withdrawal is 100 ETB. Processed within 2-3 business days to your Telebirr account.",
    "withdrawal": "💸 Withdrawal requests are processed within 2-3 business days. Minimum amount: 100 ETB.",
    
    // Pool Types
    "pool types": "🏊 Available pool types:\n• Public Pools - Anyone can join\n• Private Pools - Organization members only\n• Featured Pools - Highlighted on homepage\n\nEach pool has one winner who gets 100% of target!",
    "private pool": "🏊 Private pools are created by Organizations for their members only. Members must be approved to join.",
    
    // Support
    "contact support": "📞 Contact us:\n• Phone: 0930330323\n• Email: hundessanegassa@gmail.com\n• Or use this chat! We're here 24/7.",
    "help": "💚 I'm here to help! Ask me about:\n• Creating pools\n• Commission rates\n• Registration\n• Payments\n• Withdrawals\n• Becoming Agent/Vendor/Organization\n• Charity (2% for health)",
    
    // Default / Fallback
    "default": "💚 Thank you for your question! Here's how I can help:\n\n• How to create a pool?\n• How does commission work?\n• How to become an agent/vendor/organization?\n• Payment methods\n• Withdrawal process\n• 2% charity program\n\nOr type your specific question!"
  };

  const getResponse = (userInput) => {
    const input = userInput.toLowerCase().trim();
    
    // Check for matches in knowledgeBase
    for (const [key, response] of Object.entries(knowledgeBase)) {
      if (input.includes(key) || key.includes(input)) {
        return response;
      }
    }
    
    // Check for greetings
    if (input.match(/^(hi|hello|hey|selam|እንደምን|ታዲያስ)/i)) {
      return "👋 Hello! Welcome to Abbaa Carraa Ethio!\n\n💚 How can I help you today?\n\n• Create a pool\n• Commission info\n• Registration help\n• Payment methods\n• Withdrawal process\n• Become agent/vendor/organization\n• 2% charity program";
    }
    
    // Check for thanks
    if (input.match(/thank|thanks|አመሰግናለሁ/i)) {
      return "💚 You're welcome! Happy to help. Anything else you'd like to know?";
    }
    
    // Return default response
    return knowledgeBase.default;
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
    { text: "How to become a vendor?", emoji: "🏪" },
    { text: "Payment methods?", emoji: "💳" },
    { text: "How to withdraw?", emoji: "💸" },
    { text: "2% charity?", emoji: "💚" }
  ];

  if (!isClient) {
    return null;
  }

  return (
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
