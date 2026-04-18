import Link from 'next/link';

export default function FAQ() {
  const faqs = [
    {
      question: "What is Abbaa Carraa?",
      answer: "Abbaa Carraa is a community-driven prize platform where people contribute small amounts toward a collective prize fund. When the target is reached, a fair draw selects a winner."
    },
    {
      question: "How do I join a pool?",
      answer: "Simply browse active pools, select one you like, choose how many seats you want, and pay via Telebirr or CBE Birr."
    },
    {
      question: "What are the different user types?",
      answer: "We have four user types: Citizens (join pools), Agents (earn 10% commission), Suppliers/Manufacturers (list products & offer discounts), and Organizations/CBOs (create internal pools for members)."
    },
    {
      question: "How do Agents earn money?",
      answer: "Agents earn 10% commission on every pool they create. When the pool reaches its target and a winner is selected, the agent receives their commission automatically."
    },
    {
      question: "What is the discount for non-winners?",
      answer: "When a Supplier or Organization creates a pool, they can offer a discount (e.g., 10% off). If you participate but don't win, you still get that discount from the supplier!"
    },
    {
      question: "Can Organizations create private pools?",
      answer: "Yes! Organizations (like banks, NGOs, government offices) can create internal pools for their members only. No commission, just community saving for a common goal."
    },
    {
      question: "How is the winner selected?",
      answer: "The winner is selected through a cryptographically secure random draw. The more seats you buy, the higher your chance of winning."
    },
    {
      question: "Is my payment secure?",
      answer: "Yes! All payments are processed through Chapa, which supports Telebirr and CBE Birr with bank-level security."
    },
    {
      question: "What happens if I win?",
      answer: "You will receive an SMS and email notification immediately. The agent or supplier will contact you to arrange prize delivery within 14 days."
    },
    {
      question: "Can I get a refund if I change my mind?",
      answer: "Contributions are final and non-refundable. Think of it as buying a ticket for a chance to win."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h1>
        <p className="text-center text-gray-600 mb-12">Find answers to common questions about Abbaa Carraa</p>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-green-600 mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">Still have questions?</p>
          <Link href="/contact" className="text-green-600 hover:text-green-700 font-semibold">
            Contact Us →
          </Link>
        </div>
      </div>
    </div>
  );
}
