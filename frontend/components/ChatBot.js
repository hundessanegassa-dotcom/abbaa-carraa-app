import { useState, useRef, useEffect } from 'react';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "👋 Welcome to Abbaa Carraa! I'm your assistant. Ask me anything about our prize platform!", sender: "bot", timestamp: new Date() }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Complete knowledge base about Abbaa Carraa
  const knowledgeBase = {
    // General Info
    whatIs: "Abbaa Carraa is a community-driven prize and contribution platform where people pool small amounts of money for a chance to win big prizes. The name means 'Opportunity Father' in Oromo.",
    howItWorks: "1. Find a Pool: Browse active prize pools by city or category\n2. Contribute: Pay via Telebirr or CBE Birr securely\n3. Win & Celebrate: Fair draw selects winner when target is reached",
    
    // Registration & Roles
    register: "You can register using Email or Phone number. Choose your role: Individual, Agent, Vendor, or Organization. Anyone can create a pool and earn 10% commission!",
    roles: "👤 Individual: Join pools to win prizes\n🤝 Agent: Create pools, earn 10% commission\n🏭 Vendor: List products, winner gets FREE product\n🏢 Organization: Create private pools for members",
    becomeAgent: "Go to Register page, select 'Agent' as your role, complete registration, then click 'Create Pool' to start earning 10% commission!",
    becomeVendor: "Go to Register page, select 'Vendor' as your role. You can list your products as prizes. Winner gets FREE product, non-winners get discounts!",
    becomeOrganization: "Go to Register page, select 'Organization' as your role. Create private pools for your members only!",
    
    // Pools
    createPool: "Click 'Create Pool' in the navigation bar after logging in. Fill in prize name, description, value, duration (30-180 days), and upload an image.",
    joinPool: "Browse active pools, click 'Join Pool' on any pool, select number of seats (1-10), and complete payment via Telebirr or CBE Birr.",
    poolTypes: "We have various pools: Vehicles (Sino Truck, V8 Car, Motorcycle), Machinery (Excavator, Loader, Block Machine), Electronics, Property (Modern House), Furniture, and more!",
    
    // Commissions
    commission: "Anyone who CREATES a pool earns 10% commission when the pool completes successfully. Participants who simply JOIN pools do NOT earn commission - they compete to win prizes.",
    agentCommission: "Agents earn 10% commission on every pool they create. Example: Create a 5,500,000 ETB pool → earn 550,000 ETB commission!",
    vendorCommission: "Vendors earn 10% commission when they create pools. Plus, winner gets FREE product, non-winners get discounts from you!",
    organizationCommission: "Organizations earn 10% commission on pools they create. Perfect for member savings groups!",
    individualCommission: "Individuals earn 10% commission when they create a pool. Anyone can be an organizer!",
    
    // Cash Policy
    cashPolicy: "Winners receive the CASH EQUIVALENT of the prize value LISTED when the pool was created. The amount is locked and does not change with market prices. This ensures fairness for all participants.",
    cashEquivalent: "When a pool reaches its target, the winner gets the original listed cash value, not the current market price. Example: Sino Truck listed at 5.5M ETB → winner gets 5.5M ETB cash, even if market price increases.",
    
    // Payments
    paymentMethods: "We accept Telebirr and CBE Birr payments. Our payment gateway is secure and transactions are processed instantly.",
    telebirr: "Telebirr is Ethiopia's leading mobile money service. You can pay directly from your Telebirr account when joining pools.",
    cbeBirr: "CBE Birr is Commercial Bank of Ethiopia's mobile banking service. We accept CBE Birr for all pool contributions.",
    
    // Draw & Winners
    draw: "When a pool reaches 100% of its target amount, the system automatically runs a cryptographically secure random draw to select a winner.",
    winner: "Winners are notified via SMS and email immediately after the draw. Winners receive the cash equivalent of the prize value.",
    pastWinners: "Visit our 'Winners' page to see past winners and their amazing prizes!",
    
    // Privacy & Terms
    privacy: "We protect your data with industry-standard security. Your information is never shared without consent. View full Privacy Policy at /privacy",
    terms: "Terms include: contributions are non-refundable, draws are final, winners have 30 days to claim prizes. View full Terms at /terms",
    
    // Contact & Support
    contact: "Email: support@abbaacarraa.com | Phone: 0930330323 | Location: Ambo, Ethiopia",
    support: "Our support team is available Monday-Friday, 9 AM - 6 PM. Email us or use this chat for quick questions!",
    
    // Pricing & Costs
    pricing: "Each pool has a contribution amount (entry fee). The target amount is the total prize value. Example: 5,500,000 ETB pool with 11,000 ETB entry fee needs 500 participants.",
    contribution: "You can buy multiple seats in a pool. Each seat gives you a ticket. More seats = higher chance to win!",
    
    // Mobile App
    pwa: "Abbaa Carraa is a Progressive Web App (PWA). You can install it on your phone like a native app! On Android, tap 'Add to Home Screen'.",
    
    // Language
    languages: "We support English and Amharic. Click the language toggle at the top-right corner to switch.",
    
    // Chatbot greeting
    greeting: "👋 Welcome! I can help you with:\n• How Abbaa Carraa works\n• Registration and roles (Agent, Vendor, Organization)\n• Creating and joining pools\n• Commission structure (10% for creators)\n• Cash equivalent policy\n• Payments (Telebirr, CBE Birr)\n• Draws and winners\n• And much more!\n\nWhat would you like to know?"
  };

  // Intent mapping - what keywords trigger which response
  const intentMap = [
    { keywords: ["what is abbaa carraa", "what is abbaa", "tell me about abbaa carraa", "platform info"], response: knowledgeBase.whatIs + " " + knowledgeBase.howItWorks },
    { keywords: ["how it works", "how does it work", "how abbaa carraa works"], response: knowledgeBase.howItWorks },
    { keywords: ["register", "sign up", "create account"], response: knowledgeBase.register },
    { keywords: ["role", "user type", "types of users", "individual", "agent", "vendor", "organization"], response: knowledgeBase.roles },
    { keywords: ["become agent", "agent registration", "how to be agent"], response: knowledgeBase.becomeAgent },
    { keywords: ["become vendor", "vendor registration", "how to be vendor"], response: knowledgeBase.becomeVendor },
    { keywords: ["become organization", "organization registration"], response: knowledgeBase.becomeOrganization },
    { keywords: ["create pool", "how to create pool", "make a pool"], response: knowledgeBase.createPool },
    { keywords: ["join pool", "how to join", "participate"], response: knowledgeBase.joinPool },
    { keywords: ["pool types", "what pools", "available prizes", "products"], response: knowledgeBase.poolTypes },
    { keywords: ["commission", "earn", "how much commission"], response: knowledgeBase.commission },
    { keywords: ["agent commission", "agent earn"], response: knowledgeBase.agentCommission },
    { keywords: ["vendor commission", "vendor earn"], response: knowledgeBase.vendorCommission },
    { keywords: ["organization commission", "organization earn"], response: knowledgeBase.organizationCommission },
    { keywords: ["individual commission", "individual earn"], response: knowledgeBase.individualCommission },
    { keywords: ["cash policy", "cash equivalent", "winner cash", "cash prize policy"], response: knowledgeBase.cashPolicy + " " + knowledgeBase.cashEquivalent },
    { keywords: ["payment", "pay", "telebirr", "cbe birr"], response: knowledgeBase.paymentMethods + " " + knowledgeBase.telebirr + " " + knowledgeBase.cbeBirr },
    { keywords: ["draw", "how winner selected", "winning process"], response: knowledgeBase.draw },
    { keywords: ["winner", "win", "what winner gets"], response: knowledgeBase.winner },
    { keywords: ["past winners", "winners list"], response: knowledgeBase.pastWinners },
    { keywords: ["privacy", "data", "secure"], response: knowledgeBase.privacy },
    { keywords: ["terms", "conditions", "rules"], response: knowledgeBase.terms },
    { keywords: ["contact", "support", "help", "email", "phone"], response: knowledgeBase.contact + " " + knowledgeBase.support },
    { keywords: ["pricing", "cost", "price", "entry fee", "contribution amount"], response: knowledgeBase.pricing },
    { keywords: ["seats", "multiple seats", "tickets", "chance to win"], response: knowledgeBase.contribution },
    { keywords: ["mobile app", "pwa", "install app"], response: knowledgeBase.pwa },
    { keywords: ["language", "translate", "amharic", "english"], response: knowledgeBase.languages },
    { keywords: ["hello", "hi", "hey", "good morning", "good afternoon"], response: knowledgeBase.greeting }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getResponse = (userInput) => {
    const input = userInput.toLowerCase().trim();
    
    // Check for greetings first
    if (input.match(/^(hi|hello|hey|good morning|good afternoon|good evening|hola|selam|hello there)$/i)) {
      return knowledgeBase.greeting;
    }
    
    // Check for thank you
    if (input.match(/thank|thanks|appreciate/i)) {
      return "You're very welcome! 😊 I'm happy to help. Is there anything else you'd like to know about Abbaa Carraa?";
    }
    
    // Check intent map for matching keywords
    for (const intent of intentMap) {
      for (const keyword of intent.keywords) {
        if (input.includes(keyword.toLowerCase())) {
          return intent.response;
        }
      }
    }
    
    // Default response
    return "I'm here to help! You can ask me about:\n\n• How Abbaa Carraa works\n• Registration (Email/Phone)\n• Roles (Individual, Agent, Vendor, Organization)\n• Creating pools (10% commission!)\n• Joining pools\n• Cash equivalent policy\n• Payments (Telebirr, CBE Birr)\n• Draws and winners\n\nWhat would you like to know? 🌟";
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: "user", timestamp: new Date() }]);
    setInput("");
    setIsTyping(true);
    
    // Simulate thinking delay
    setTimeout(() => {
      const response = getResponse(userMessage);
      setMessages(prev => [...prev, { text: response, sender: "bot", timestamp: new Date() }]);
      setIsTyping(false);
    }, 500);
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

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-all duration-200 hover:scale-105"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 z-50 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  Abbaa Carraa Assistant
                </h3>
                <p className="text-xs opacity-90">Online • Ask me anything!</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-2.5 ${
                  msg.sender === 'user' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-green-100' : 'text-gray-400'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="border-t border-gray-100 p-2 bg-gray-50">
            <div className="flex gap-1 overflow-x-auto pb-1">
              <button onClick={() => setInput("How do I create a pool?")} className="text-xs bg-gray-200 hover:bg-gray-300 rounded-full px-2 py-1 whitespace-nowrap transition">
                📝 Create pool
              </button>
              <button onClick={() => setInput("How does commission work?")} className="text-xs bg-gray-200 hover:bg-gray-300 rounded-full px-2 py-1 whitespace-nowrap transition">
                💰 Commission
              </button>
              <button onClick={() => setInput("What is cash equivalent policy?")} className="text-xs bg-gray-200 hover:bg-gray-300 rounded-full px-2 py-1 whitespace-nowrap transition">
                💵 Cash policy
              </button>
              <button onClick={() => setInput("How to become an agent?")} className="text-xs bg-gray-200 hover:bg-gray-300 rounded-full px-2 py-1 whitespace-nowrap transition">
                🤝 Become agent
              </button>
            </div>
          </div>

          {/* Input */}
          <div className="border-t p-2 flex gap-2 bg-white">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
              rows={1}
              style={{ maxHeight: '80px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
