// pages/faq.js - SIMPLIFIED FAQ INCLUDING ALL PROGRAMS
import BackButton from '../components/BackButton';
import { useState } from 'react';
import Link from 'next/link';

export async function getServerSideProps() {
  return { props: {} };
}

export default function FAQ() {
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  const faqCategories = [
    {
      title: "🎯 All Programs Overview",
      icon: "🎯",
      questions: [
        {
          q: "What programs does Abbaa Carraa offer?",
          a: "We offer THREE exciting programs:\n\n1. Merkato VIP - Special program for Merkato traders with prizes up to 40 Million ETB\n2. City VIP - Program for specific cities across Ethiopia with prizes up to 40 Million ETB  \n3. Regular Pools - Win cars, houses, electronics, and more through community savings"
        },
        {
          q: "How do I join any program?",
          a: "Simple steps:\n1. Register for free\n2. Browse available programs\n3. Select your seats\n4. Pay via TeleBirr or Bank Transfer\n5. Wait for the draw\n6. Win amazing prizes!"
        }
      ]
    },
    {
      title: "⭐ Merkato VIP Program",
      icon: "⭐",
      questions: [
        {
          q: "What is Merkato VIP?",
          a: "Merkato VIP is a special program for Merkato's 7,100+ businesses and 13,000+ workers. It offers daily, weekly, and monthly prizes up to 40 Million ETB."
        },
        {
          q: "What prizes can I win in Merkato VIP?",
          a: "Daily: 1,000,000 ETB | Weekly: 10,000,000 ETB | Monthly: 40,000,000 ETB"
        },
        {
          q: "How much does it cost to join Merkato VIP?",
          a: "Daily pool: 500 ETB | Weekly pool: 2,500 ETB | Monthly pool: 5,000 ETB"
        },
        {
          q: "When are the Merkato VIP draws?",
          a: "Daily: Every day at 8:00 PM | Weekly: Every Sunday at 6:00 PM | Monthly: Last day of month at 8:00 PM"
        }
      ]
    },
    {
      title: "🏙️ City VIP Program",
      icon: "🏙️",
      questions: [
        {
          q: "What is City VIP?",
          a: "City VIP is an exclusive program for 94+ Ethiopian cities. Each city has its own VIP pool with prizes up to 40 Million ETB."
        },
        {
          q: "Which cities are available?",
          a: "All major Ethiopian cities including Addis Ababa, Dire Dawa, Mekelle, Gondar, Bahir Dar, Hawassa, Jimma, Adama, Harar, Jijiga, and 84+ more cities."
        },
        {
          q: "How do I join my city's VIP program?",
          a: "Click 'City VIP' on the homepage, search for your city, select your seats, and pay. It's that simple!"
        },
        {
          q: "What are the prizes for City VIP?",
          a: "Same as Merkato VIP: Daily 1M ETB, Weekly 10M ETB, Monthly 40M ETB"
        }
      ]
    },
    {
      title: "🏊 Regular Pools",
      icon: "🏊",
      questions: [
        {
          q: "What are Regular Pools?",
          a: "Regular Pools are community savings programs where people contribute small amounts to win big prizes like cars, houses, machinery, and electronics."
        },
        {
          q: "What prizes can I win?",
          a: "Cars, houses, apartments, machinery, electronics (TVs, laptops, phones), home appliances, and much more!"
        },
        {
          q: "How much do I need to contribute?",
          a: "Each pool has different contribution amounts. You can filter by price (Low to High or High to Low) to find a pool that fits your budget."
        },
        {
          q: "How are winners selected?",
          a: "Winners are selected through a fair, random, blockchain-verified draw when the pool reaches its target."
        }
      ]
    },
    {
      title: "💳 Payments & Fees",
      icon: "💳",
      questions: [
        {
          q: "How can I pay?",
          a: "We accept TeleBirr and CBE Bank Transfer. Both are secure and easy to use."
        },
        {
          q: "Is there any hidden fee?",
          a: "No hidden fees. 2% of every contribution goes to support kidney and heart disease patients in Ethiopia. This is clearly shown before you confirm."
        },
        {
          q: "Can I get a refund?",
          a: "Contributions are non-refundable once you join a pool. You are paying for a chance to win, not for a guaranteed product."
        }
      ]
    },
    {
      title: "🏆 Winners & Draws",
      icon: "🏆",
      questions: [
        {
          q: "When are draws held?",
          a: "Merkato VIP & City VIP: Daily at 8 PM, Weekly on Sunday at 6 PM, Monthly on last day at 8 PM. Regular Pools: Each pool has its own draw date shown on the pool card."
        },
        {
          q: "How will I know if I won?",
          a: "You will receive an email and SMS notification immediately when you win. You can also check your dashboard."
        },
        {
          q: "How do I claim my prize?",
          a: "Follow the instructions sent to your email. Prizes are delivered within 14 days after the draw."
        }
      ]
    },
    {
      title: "🤝 Partner Programs",
      icon: "🤝",
      questions: [
        {
          q: "How can I become an Agent?",
          a: "Click 'Become an Agent' at the bottom of the homepage. You'll earn 10% commission on every successful pool you help create."
        },
        {
          q: "How can I become a Vendor?",
          a: "Click 'Become a Vendor' to list your products as prizes. When someone wins your pool, you deliver the prize or cash equivalent."
        },
        {
          q: "How can my organization join?",
          a: "Click 'Become an Organization' to create private pools for your members, staff, or community groups."
        }
      ]
    },
    {
      title: "🔒 Security & Trust",
      icon: "🔒",
      questions: [
        {
          q: "Is the platform secure?",
          a: "Yes! We use bank-level security, blockchain verification for draws, and secure payment processing through Chapa."
        },
        {
          q: "Are the draws fair?",
          a: "Absolutely! All draws are random, transparent, and blockchain-verified. Anyone can verify the results."
        },
        {
          q: "What about the 2% charity contribution?",
          a: "2% of every contribution goes directly to support kidney and heart disease patients in Ethiopia."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-4"><BackButton /></div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Everything you need to know about Merkato VIP, City VIP & Regular Pools
        </p>
        
        <div className="space-y-4">
          {faqCategories.map((category, catIndex) => (
            <div key={catIndex} className="bg-white rounded-lg shadow-md overflow-hidden">
              <button 
                className="w-full bg-green-50 p-4 hover:bg-green-100 transition text-left"
                onClick={() => toggleSection(catIndex)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <h2 className="text-lg font-bold text-green-700">{category.title}</h2>
                  </div>
                  <span className="text-green-600 text-xl">
                    {openSection === catIndex ? '−' : '+'}
                  </span>
                </div>
              </button>
              
              {openSection === catIndex && (
                <div className="divide-y divide-gray-100">
                  {category.questions.map((faq, idx) => (
                    <div key={idx} className="p-5">
                      <h3 className="font-bold text-base mb-2 text-gray-800">
                        {faq.q}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still Have Questions - Using ONLY your email */}
        <div className="mt-12 text-center p-6 bg-green-50 rounded-lg">
          <p className="text-gray-700 mb-3 font-semibold">
            Still have questions? We're here to help!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/contact" 
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Contact Support
            </Link>
            <a 
              href="mailto:hundessanegassa@gmail.com" 
              className="border border-green-600 text-green-600 px-6 py-2 rounded-lg hover:bg-green-50 transition"
            >
              📧 hundessanegassa@gmail.com
            </a>
            <a 
              href="tel:0930330323" 
              className="border border-green-600 text-green-600 px-6 py-2 rounded-lg hover:bg-green-50 transition"
            >
              📞 0930330323
            </a>
            <a 
              href="tel:0913277922" 
              className="border border-green-600 text-green-600 px-6 py-2 rounded-lg hover:bg-green-50 transition"
            >
              📞 0913277922
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
