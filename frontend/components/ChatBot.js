import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "👋 እንኳን ደህና መጡ ወደ Abbaa Carraa Ethio! | Welcome to Abbaa Carraa Ethio!\n\n💚 I'm your assistant. Ask me anything about our prize platform!\n\nእንዴት ልረዳዎት እችላለሁ?", sender: "bot", timestamp: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getCurrentUser();
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Enhanced Knowledge Base with Correct Commission Info
  const knowledgeBase = {
    // General Info
    whatIs: "🏆 Abbaa Carraa Ethio is Ethiopia's #1 community prize platform where people pool small contributions for a chance to win BIG prizes! 2% of all income supports kidney & heart disease treatment.",
    howItWorks: "✨ *How It Works:*\n\n1️⃣ Browse active prize pools\n2️⃣ Make contribution (as low as 100 ETB)\n3️⃣ Get your ticket number\n4️⃣ Live fair draw selects winner!\n5️⃣ Winner announced & prize delivered!\n\n💚 Every contribution saves lives!",
    
    // Commission - CORRECTED!
    commission: "💰 *Important Commission Info:*\n\n✅ When you CREATE a pool, you earn 10% commission on the total collection (winner gets 100%, you get 10%, platform gets 10% = 120% total).\n\n❌ If you simply JOIN a pool as participant, you do NOT earn commission - you compete to win the prize!\n\n📝 Example: Create 500,000 ETB pool → Total collection 600,000 ETB → You earn 50,000 ETB commission!",
    agentCommission: "🤝 *Agent Commission:*\n\n• Create pools and earn 10% commission\n• Example: 500,000 ETB pool → You earn 50,000 ETB\n• Paid within 14 days after winner receives prize\n• No listing fees, no upfront costs!",
    vendorCommission: "🏪 *Vendor Commission:*\n\n• List products as prizes\n• Earn 10% commission on pools created from your products\n• Offer discounts (5-50%) to non-winners\n• Winner gets FREE product!",
    organizationCommission: "🏢 *Organization Commission:*\n\n• Create private pools for members only\n• Earn 10% commission on each pool\n• Perfect for staff savings & team building!",
    individualCommission: "👤 *Individual Participant:*\n\n• Join pools to WIN prizes\n• You can also CREATE pools and earn 10% commission!\n• Anyone can be an organizer!",
    
    // Roles Corrected
    roles: "👥 *Available Roles:*\n\n• 👤 Individual: Join pools to be a winner\n• 🤝 Agent: Create pools, earn 10% commission\n• 🏪 Vendor: List products, earn commission\n• 🏢 Organization: Private pools for members\n\n❌ Participants joining pools do NOT earn commission - only pool creators earn!",
    
    // Registration
    register: "📝 *How to Register:*\n\n1. Click 'Register' button\n2. Choose your role (Individual/Agent/Vendor/Organization)\n3. Sign in with Google (fastest!)\n4. Accept agreement\n5. Start participating or creating pools!\n\n✨ Google login is instant and works best in Ethiopia!",
    
    // Pool Creation
    createPool: "📦 *How to Create a Pool:*\n\n1. Login to your account\n2. Click 'Create Pool' in navigation\n3. Enter prize name, description, target amount\n4. Upload prize image (5MB max)\n5. Set entry fee and end date\n6. Click 'Create Prize Pool'\n\n🚀 Your pool will appear in listings immediately!",
    
    // Cash Policy
    cashPolicy: "💰 *Cash Equivalent Policy:*\n\n✅ Winners receive CASH EQUIVALENT of the listed prize value\n✅ Amount is locked when pool is created\n✅ Does NOT change with market prices\n✅ Fair for all participants!\n\nExample: Prize listed at 500,000 ETB → winner gets 500,000 ETB cash!",
    
    // Payments
    paymentMethods: "💳 *Payment Methods:*\n\n📱 Telebirr - Ethiopia's leading mobile money\n🏦 CBE Birr - Bank of Ethiopia mobile banking\n💳 Bank Transfer - Direct transfer\n🏧 Cash at Agent - Pay through local agents\n\nAll payments are secure and processed instantly!",
    
    // Draw Process
    draw: "🎲 *Draw Process:*\n\n• When pool reaches 100%, draw runs automatically\n• Cryptographically secure random selection\n• Results are blockchain-verified\n• Winner notified via SMS/Email\n• Prize delivered within 14 days!\n\n🔐 100% transparent and fair!",
    
    // Charity
    charity: "💚 *2% for Health Initiative:*\n\n• Every contribution, 2% goes to charity\n• Supports kidney disease treatment\n• Supports heart disease treatment\n• Lives saved across Ethiopia!\n\nYour participation saves lives! 🙏",
    
    // Welcome message
    greeting: "👋 እንኳን ደህና መጡ! | Welcome!\n\n💚 I'm your Abbaa Carraa assistant.\n\n📌 I can help you with:\n• How the platform works\n• Registration (Google login recommended)\n• Creating pools (earn 10% commission)\n• Joining pools (win prizes!)\n• Payment methods (Telebirr/CBE Birr)\n• Cash equivalent policy\n• Winners & draws\n\n❓ What would you like to know?\n\nእንዴት ልረዳዎት እችላለሁ?"
  };

  // Enhanced Intent Map
  const intentMap = [
    { keywords: ["what is abbaa carraa", "what is this platform", "tell me about", "platform info", "abbaa carraa ethio"], response: knowledgeBase.whatIs + "\n\n" + knowledgeBase.howItWorks },
    { keywords: ["how it works", "how does it work", "explain platform", "how to play"], response: knowledgeBase.howItWorks },
    { keywords: ["commission", "earn money", "how to earn", "make money", "10%"], response: knowledgeBase.commission },
    { keywords: ["agent commission", "agent earn", "what does agent earn"], response: knowledgeBase.agentCommission },
    { keywords: ["vendor commission", "vendor earn", "what does vendor earn"], response: knowledgeBase.vendorCommission },
    { keywords: ["organization commission", "organization earn", "what does organization earn"], response: knowledgeBase.organizationCommission },
    { keywords: ["individual earn", "participant earn", "individual commission"], response: knowledgeBase.individualCommission },
    { keywords: ["role", "user type", "types of users", "what are the roles"], response: knowledgeBase.roles },
    { keywords: ["register", "sign up", "create account", "how to join"], response: knowledgeBase.register },
    { keywords: ["become agent", "how to be agent", "agent registration"], response: knowledgeBase.becomeAgent || knowledgeBase.roles },
    { keywords: ["become vendor", "vendor registration", "how to be vendor"], response: knowledgeBase.becomeVendor || knowledgeBase.roles },
    { keywords: ["become organization", "organization registration"], response: knowledgeBase.becomeOrganization || knowledgeBase.roles },
    { keywords: ["create pool", "how to create pool", "make a pool", "start a pool"], response: knowledgeBase.createPool },
    { keywords: ["join pool", "how to join", "participate", "enter a pool"], response: "🎯 To join a pool:\n\n1. Browse active pools on homepage\n2. Click 'Join Now' on your chosen pool\n3. Select number of seats (more seats = higher chance!)\n4. Pay via Telebirr or CBE Birr\n5. Get your ticket number!\n\nGood luck! 🍀" },
    { keywords: ["cash policy", "cash equivalent", "winner cash", "cash prize", "cash value"], response: knowledgeBase.cashPolicy },
    { keywords: ["payment", "pay", "telebirr", "cbe birr", "how to pay"], response: knowledgeBase.paymentMethods },
    { keywords: ["draw", "how winner selected", "winning process", "random draw"], response: knowledgeBase.draw },
    { keywords: ["winner", "win", "what winner gets", "prize delivery"], response: knowledgeBase.winner || "🏆 Winners receive the CASH EQUIVALENT of the listed prize value! Prize delivered within 14 days after draw." },
    { keywords: ["charity", "2%", "health", "kidney", "heart", "donation"], response: knowledgeBase.charity },
    { keywords: ["privacy", "data", "secure", "safety"], response: "🔒 We protect your data with industry-standard security. Your information is never shared without consent. View full Privacy Policy at /privacy" },
    { keywords: ["terms", "conditions", "rules", "policy"], response: "📜 Terms include: contributions are non-refundable, draws are final, winners have 14 days to claim prizes. View full Terms at /terms" },
    { keywords: ["contact", "support", "help", "email", "phone", "customer service"], response: "📞 Contact Us:\n\n📧 Email: support@abbaacarraa.com\n📱 Phone: 0930330323\n📍 Location: Ambo, Ethiopia\n\n💬 Or continue chatting here! We're happy to help." }
  ];

  const getResponse = (userInput) => {
    const input = userInput.toLowerCase().trim();
    
    // Check for greetings
    if (input.match(/^(hi|hello|hey|good morning|good afternoon|good evening|hola|selam|hello there|ሰላም)$/i)) {
      return knowledgeBase.greeting;
    }
    
    // Check for thank you
    if (input.match(/thank|thanks|appreciate|ደስ አለኝ/i)) {
      return "You're very welcome! 😊 እንኳን ደስ አለኝ!\n\nIs there anything else you'd like to know about Abbaa Carraa Ethio? 💚";
    }
    
    // Check for goodbye
    if (input.match(/bye|goodbye|see you|ቻው/i)) {
      return "👋 Thank you for chatting! Come back anytime. Good luck winning amazing prizes! 🎁\n\nበህንኖር!";
    }
    
    // Check intent map
    for (const intent of intentMap) {
      for (const keyword of intent.keywords) {
        if (input.includes(keyword.toLowerCase())) {
          return intent.response;
        }
      }
    }
    
    // Default response - more helpful
    return "💚 I'm here to help!\n\n📌 You can ask me about:\n\n• How the platform works\n• Registration (Google login is fastest!)\n• Creating pools (earn 10% commission)\n• Joining pools (win prizes!)\n• Payment methods (Telebirr, CBE Birr)\n• Cash equivalent policy\n• Winners and draws\n• Charity initiative (2% for health)\n\n❓ What would you like to know?\n\nእንዴት ልረዳዎት እችላለሁ?";
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: "user", timestamp: new Date() }]);
    setInput("");
    setIsTyping(true);
    
    // Small delay for realistic typing
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

  return (
    <>
      {/* Chat Button */}
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

      {/* Chat Window */}
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
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
