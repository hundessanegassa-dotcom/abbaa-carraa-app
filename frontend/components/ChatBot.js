import { useState } from 'react';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! How can I help you today?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");

  const faqs = [
    { keywords: ["pool", "create pool"], response: "To create a pool, click 'Create Pool' in the navigation bar after logging in." },
    { keywords: ["commission", "earn"], response: "You earn 10% commission when you create a pool and it completes successfully!" },
    { keywords: ["agent", "become agent"], response: "Register as an Agent to earn 10% commission on pools you create. Click 'Become Agent' in the navbar." },
    { keywords: ["vendor", "become vendor"], response: "Register as a Vendor to list your products as prizes. Winners get the product FREE!" },
    { keywords: ["organization", "register organization"], response: "Organizations can create private pools for their members and earn 10% commission." },
    { keywords: ["payment", "telebirr", "cbe"], response: "We accept Telebirr and CBE Birr payments through our secure Chapa gateway." },
    { keywords: ["winner", "win", "draw"], response: "When a pool reaches its target, a fair random draw selects the winner. Winners are notified via SMS and email." },
    { keywords: ["discount", "non-winner"], response: "If you don't win, vendors may offer you a discount to purchase their product directly!" }
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { text: input, sender: "user" }]);

    // Find response
    const lowerInput = input.toLowerCase();
    const matched = faqs.find(faq => 
      faq.keywords.some(keyword => lowerInput.includes(keyword))
    );

    const response = matched ? matched.response : "I'm here to help! Ask me about pools, commissions, payments, or how to become an agent/vendor/organization.";
    
    setTimeout(() => {
      setMessages(prev => [...prev, { text: response, sender: "bot" }]);
    }, 500);

    setInput("");
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition"
      >
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-16 left-4 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200">
          {/* Header */}
          <div className="bg-green-600 text-white p-3 rounded-t-lg">
            <h3 className="font-bold">Abbaa Carraa Assistant</h3>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-2 rounded-lg ${msg.sender === 'user' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t p-2 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your question..."
              className="flex-1 p-2 border rounded-lg text-sm"
            />
            <button onClick={handleSend} className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm">
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
