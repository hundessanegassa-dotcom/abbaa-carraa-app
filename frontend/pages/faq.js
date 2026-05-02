import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function FAQ() {
  const { t } = useTranslation();
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  const faqCategories = [
    {
      title: "🏆 General Questions",
      icon: "🏆",
      questions: [
        {
          q: "What is Abbaa Carraa?",
          a: "Abbaa Carraa (Meaning 'Opportunity Father' in Oromo) is Ethiopia's first community-driven prize platform. It allows people to contribute small amounts of money toward a collective prize fund. When the pool reaches its target, a fair, cryptographically secure draw selects a winner.",
          example: "📌 Example: A group of 500 people each contribute 1,000 ETB to win a 500,000 ETB car. The pool reaches 500,000 ETB, a random draw selects one winner, and they receive the car (or cash equivalent)."
        },
        {
          q: "How does Abbaa Carraa work?",
          a: "The platform works in 3 simple steps: (1) Browse active prize pools by city or category, (2) Contribute via Telebirr or CBE Birr, (3) Win when the pool reaches its target through a fair draw.",
          example: "📌 Example: A Toyota Vitz pool has a target of 500,000 ETB. 1,000 people contribute 500 ETB each. When the target is reached, the system randomly selects one winner who receives the car."
        },
        {
          q: "What payment methods are accepted?",
          a: "We accept Telebirr and CBE Birr through our secure payment gateway, Chapa. Both are secure, instant, and widely used in Ethiopia.",
          example: "📌 Example: After selecting a pool, you choose 'Telebirr', enter your phone number, approve the payment on your phone, and you're instantly entered into the pool."
        },
        {
          q: "Is the platform secure?",
          a: "Yes! We use Supabase Row Level Security for data protection, JWT authentication, and PCI-compliant payments through Chapa. Your personal and payment information is always encrypted.",
          example: "📌 Example: Your password is hashed using bcrypt, payment info goes directly to Chapa (never stored on our servers), and your data is protected by database-level security policies."
        }
      ]
    },
    {
      title: "👤 For Contributors (Regular Users)",
      icon: "👤",
      questions: [
        {
          q: "How do I join a pool?",
          a: "Browse active pools on the homepage, select a prize you're interested in, choose how many seats you want (more seats = higher chance of winning), and pay via Telebirr or CBE Birr.",
          example: "📌 Example: You want to win a laptop worth 50,000 ETB. The pool has 100 seats at 500 ETB each. You buy 2 seats (1,000 ETB) – you now have 2 chances to win instead of 1."
        },
        {
          q: "How is the winner selected?",
          a: "When a pool reaches 100% of its target, the system automatically runs a cryptographically secure random draw. Each contribution = tickets. More tickets = higher chance of winning.",
          example: "📌 Example: A pool has 1,000 total tickets. If you bought 10 tickets, you have a 1% chance of winning. If you bought 100 tickets, you have a 10% chance. The draw is verifiable and transparent."
        },
        {
          q: "What if I don't win?",
          a: "Your contribution is non-refundable, but you helped someone else achieve their dream. Think of it as community support – every contribution brings someone closer to their prize.",
          example: "📌 Example: You contributed 1,000 ETB to a car pool but didn't win. The winner receives their car, and you can try again on another pool. Your contribution wasn't wasted – it made the prize possible."
        },
        {
          q: "Do I get the actual product or cash?",
          a: "You receive the actual physical product if the pool creator has it. If the product is unavailable, you receive the cash equivalent of the listed target amount.",
          example: "📌 Example: If you win a car pool and the vendor has the car, you get the car. If the car is sold or unavailable, you receive the full cash amount (e.g., 500,000 ETB)."
        },
        {
          q: "How long until I receive my prize?",
          a: "Pool creators have 14 days to deliver the prize after the draw. You will receive SMS and email notifications immediately when you win.",
          example: "📌 Example: You win on May 1st. The agent must deliver your prize by May 15th. If delayed, contact support@abbaacarraa.com."
        },
        {
          q: "Can I get a refund if I change my mind?",
          a: "No. Contributions are final and non-refundable once a pool is active. This is like buying a raffle ticket – you're paying for a chance to win, not for a guaranteed product."
        }
      ]
    },
    {
      title: "🏗️ For Pool Creators (Agents, Vendors, Individuals, Organizations)",
      icon: "🏗️",
      questions: [
        {
          q: "Who can create a prize pool?",
          a: "Anyone! Agents, vendors, organizations, community groups, and regular users can all create prize pools. No special status required.",
          example: "📌 Example: A car dealer creates a pool for a new Toyota. A furniture shop creates a pool for a sofa set. An individual creates a pool for their used laptop. Anyone can do it!"
        },
        {
          q: "How much commission do I earn?",
          a: "You earn 10% commission on the total pool collection when the pool successfully completes. The target amount (what winner gets) is 80% of the total collection.",
          example: "📌 Example: You set target amount = 500,000 ETB (winner gets this). Add 20% (100,000 ETB) for your commission. Total collected = 600,000 ETB. You earn 100,000 ETB commission when the pool completes."
        },
        {
          q: "Is there a cost to list a prize?",
          a: "No! Listing is completely free. You only pay when you contribute to a pool as a participant. There are no upfront fees or subscription costs.",
          example: "📌 Example: You list a 500,000 ETB car. No cost to list. When 500 people each contribute 1,000 ETB (500,000 ETB target), you add 20% commission (100,000 ETB), total 600,000 ETB collected. You earn 100,000 ETB."
        },
        {
          q: "What if I don't have the physical product?",
          a: "You must provide the cash equivalent of the target amount to the winner. The platform guarantees this – it's part of our 'Cash Equivalent Guarantee' policy.",
          example: "📌 Example: You created a car pool but the car was sold. When someone wins, you pay them 500,000 ETB cash instead of the car. The winner receives the full value."
        },
        {
          q: "What if I have the physical product?",
          a: "You provide the actual product to the winner within 14 days. The cash equivalent is only a backup guarantee for winners if you can't provide the product.",
          example: "📌 Example: You're a car dealer with a car in stock. Someone wins your pool – you deliver the physical car to them within 14 days. Everyone is happy!"
        },
        {
          q: "When do I get paid my commission?",
          a: "Commissions are paid within 7 days after the winner confirms they received their prize (or after the 14-day delivery period).",
          example: "📌 Example: Draw on May 1st. Winner receives car on May 10th. You receive your 100,000 ETB commission by May 17th via Telebirr or bank transfer."
        },
        {
          q: "Can I offer discounts to participants?",
          a: "Yes! You can offer discount codes (5-50%) to all non-winners. This is a great way to turn participants into customers.",
          example: "📌 Example: You're a furniture shop with a 50,000 ETB sofa pool. You offer 20% discount to everyone who participates but doesn't win. 100 people join – 99 get a 20% discount code they can use at your shop!"
        },
        {
          q: "How do I create a pool?",
          a: "Step-by-step:\n1. Register an account (free)\n2. Go to Dashboard → Create Listing\n3. Add prize name, description, images, category\n4. Set your target amount (what winner receives)\n5. System automatically calculates your 20% commission\n6. Click 'Create Prize Pool' – goes live immediately!",
          example: "📌 Example: You list a 'Samsung 4K TV - 50,000 ETB'. Target = 50,000 ETB. System calculates: total collection = 60,000 ETB (50,000 + 20% commission). You earn 10,000 ETB when pool completes."
        }
      ]
    },
    {
      title: "📦 For Vendors (Listing Products)",
      icon: "📦",
      questions: [
        {
          q: "What products can I list?",
          a: "Vehicles, electronics, machinery, furniture, property, or any valuable item. All products must be legal and accurately described.",
          example: "📌 Example: A car dealer lists a Toyota Vitz (650,000 ETB). A phone shop lists iPhone 15 Pro (120,000 ETB). A construction company lists an excavator (5,500,000 ETB)."
        },
        {
          q: "Do I have to deliver the actual product?",
          a: "Yes, if you have it. If you cannot deliver the product (sold out, unavailable), you must provide the cash equivalent of the target amount.",
          example: "📌 Example: You listed a laptop pool. The laptop sold out before the pool completed. When someone wins, you pay them 50,000 ETB cash instead."
        },
        {
          q: "What happens to my product during the pool?",
          a: "You keep the product until the pool completes. You only deliver it to the winner after the draw.",
          example: "📌 Example: You list a car for a 90-day pool. You continue to display and sell the car normally. If someone wins, you deliver it. If not, you keep it."
        }
      ]
    },
    {
      title: "🏢 For Organizations (Banks, NGOs, Schools, Community Groups)",
      icon: "🏢",
      questions: [
        {
          q: "Can we create private pools for our members only?",
          a: "Yes! Organizations can create private, member-only pools. Perfect for staff saving schemes, community groups, or member rewards.",
          example: "📌 Example: A bank creates a private laptop pool for its 500 employees. Only employees can join. No commission – just community saving for a shared goal."
        },
        {
          q: "What are the benefits for organizations?",
          a: "Build community saving habits, engage members with exciting prizes, boost morale, and create team bonding – with no administrative overhead.",
          example: "📌 Example: An NGO creates a monthly laptop pool for staff. 50 staff contribute 100 ETB each month. One staff member wins the laptop each month. It builds excitement and community."
        }
      ]
    },
    {
      title: "👑 For Admins",
      icon: "👑",
      questions: [
        {
          q: "How do I run a prize draw?",
          a: "Go to /admin/draw, find pools marked 'Ready for Draw', click 'Run Draw'. The system automatically selects a random winner, sends SMS/email, and updates the pool status.",
          example: "📌 Example: A pool reached 500,000 ETB. As admin, you click 'Run Draw'. Within seconds, the system selects a winner, sends them a congratulatory SMS, and marks the pool as 'Completed'."
        },
        {
          q: "How do I verify an agent?",
          a: "Check the agents table in Supabase. Review their business documents, then run: UPDATE public.agents SET verified = true WHERE id = 'agent-id';",
          example: "📌 Example: An agent applies. You verify their business license is valid. You approve them, and now they can create pools and earn commissions."
        },
        {
          q: "How do I backup the database?",
          a: "Supabase Project Settings → Database → Backups. You can download daily backups or set up automatic backups to external storage.",
          example: "📌 Example: Every night at 2 AM, Supabase creates an automatic backup. You can restore from any backup if needed."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">Frequently Asked Questions</h1>
        <p className="text-center text-gray-600 mb-8">Everything you need to know about Abbaa Carraa</p>
        
        <div className="space-y-6">
          {faqCategories.map((category, catIndex) => (
            <div key={catIndex} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div 
                className="bg-green-50 p-4 cursor-pointer hover:bg-green-100 transition"
                onClick={() => toggleSection(catIndex)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-xl font-bold text-green-700">{category.title}</h2>
                  <span className="ml-auto text-green-600">
                    {openSection === catIndex ? '▲' : '▼'}
                  </span>
                </div>
              </div>
              
              {openSection === catIndex && (
                <div className="divide-y divide-gray-100">
                  {category.questions.map((faq, idx) => (
                    <div key={idx} className="p-5">
                      <h3 className="font-bold text-lg mb-2 text-gray-800">{faq.q}</h3>
                      <p className="text-gray-600 mb-3 leading-relaxed">{faq.a}</p>
                      {faq.example && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                          <p className="text-blue-800 text-sm font-medium">{faq.example}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-12 text-center p-6 bg-green-50 rounded-lg">
          <p className="text-gray-700 mb-3">Still have questions? We're here to help!</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
              Contact Support
            </Link>
            <a href="mailto:support@abbaacarraa.com" className="border border-green-600 text-green-600 px-6 py-2 rounded-lg hover:bg-green-50 transition">
              Email: support@abbaacarraa.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
