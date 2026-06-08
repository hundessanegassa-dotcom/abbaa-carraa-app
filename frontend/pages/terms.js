// pages/terms.js - UPDATED WITH ALL THREE PROGRAMS
import BackButton from '../components/BackButton';
import Link from 'next/link';

export async function getServerSideProps() {
  return { props: {} };
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-4"><BackButton /></div>
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Terms & Conditions</h1>
          <p className="text-center text-gray-500 mb-8">Last Updated: May 2026</p>

          <div className="space-y-8 text-gray-700">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">1. Introduction & Acceptance</h2>
              <p className="mb-3">Welcome to Abbaa Carraa ("Platform", "We", "Us", "Our"). By accessing or using our platform, you agree to be bound by these Terms & Conditions ("Terms"). This applies to all three programs: <strong>Merkato VIP, City VIP, and Regular Pools</strong>.</p>
              <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">When you register an account, join Merkato VIP, select your city for City VIP, or contribute to a Regular Pool, you are automatically agreeing to these Terms.</p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">2. Our Three Programs</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="text-2xl mb-1">🏪</div>
                  <h3 className="font-bold">Merkato VIP</h3>
                  <p className="text-xs">Special program for Merkato traders with prizes up to 40M ETB</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="text-2xl mb-1">🏙️</div>
                  <h3 className="font-bold">City VIP</h3>
                  <p className="text-xs">City-based programs across 94+ Ethiopian cities</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="text-2xl mb-1">🏊</div>
                  <h3 className="font-bold">Regular Pools</h3>
                  <p className="text-xs">Community prize pools for cars, houses, electronics & more</p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">3. Definitions</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    <tr className="border-b"><td className="py-2 font-semibold w-40">"Platform"</td><td className="py-2">Abbaa Carraa website and services (Merkato VIP, City VIP, Regular Pools)</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">"Merkato VIP"</td><td className="py-2">Special program for Merkato businesses and workers</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">"City VIP"</td><td className="py-2">City-based program for 94+ Ethiopian cities</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">"Regular Pool"</td><td className="py-2">Community prize pools for various products</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">"Pool"</td><td className="py-2">Any prize collection across all three programs</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">"Contributor"</td><td className="py-2">A user who pays into any pool</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">"Winner"</td><td className="py-2">The contributor randomly selected when a pool reaches its target</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">"Commission"</td><td className="py-2">10% of the total pool collection paid to agents/organizers</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">"Target Amount"</td><td className="py-2">The prize value that the winner receives</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">"Cash Equivalent"</td><td className="py-2">The cash value of the prize if the physical prize is unavailable</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">4. Eligibility</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Must be 18 years or older</li>
                <li>Must have a valid Ethiopian phone number</li>
                <li>Must provide accurate registration information</li>
                <li>One account per person (duplicate accounts may be suspended)</li>
                <li>Open to all Ethiopians nationwide</li>
              </ul>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">If you create multiple accounts to increase your chances of winning in Merkato VIP, City VIP, or Regular Pools, all your accounts will be suspended.</p>
              </div>
            </section>

            {/* Section 5 - Updated for all programs */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">5. Joining a Program</h2>
              <h3 className="font-semibold mt-3">5.1 Merkato VIP</h3>
              <p>Open to all Ethiopians. Daily (500 ETB), Weekly (2,500 ETB), or Monthly (5,000 ETB) participation.</p>
              
              <h3 className="font-semibold mt-3">5.2 City VIP</h3>
              <p>Select your city from 94+ Ethiopian cities. Daily (500 ETB), Weekly (2,500 ETB), or Monthly (5,000 ETB).</p>
              
              <h3 className="font-semibold mt-3">5.3 Regular Pools</h3>
              <p>Various contribution amounts based on the prize value. Filter by price (Low to High or High to Low).</p>
              
              <h3 className="font-semibold mt-3">5.4 How to Contribute to Any Program</h3>
              <ol className="list-decimal pl-6 space-y-1">
                <li>Select your program (Merkato VIP, City VIP, or Regular Pool)</li>
                <li>Choose your seats/tickets</li>
                <li>Pay via TeleBirr or CBE Bank Transfer</li>
                <li>Receive instant confirmation and your ticket</li>
              </ol>
              
              <h3 className="font-semibold mt-3">5.5 Non-Refundable</h3>
              <p>All contributions across ALL programs are <strong>final and non-refundable</strong> once a pool is active.</p>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-red-300">
                <p className="text-sm font-semibold">⚠️ Important:</p>
                <p className="text-sm">Whether you join Merkato VIP, City VIP, or a Regular Pool, you cannot request a refund after payment.</p>
              </div>
            </section>

            {/* Section 6 - Updated for all programs */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">6. Prize Draws & Winners</h2>
              <h3 className="font-semibold mt-3">6.1 Draw Schedules</h3>
              <ul className="list-disc pl-6">
                <li><strong>Merkato VIP & City VIP:</strong> Daily at 8 PM, Weekly on Sunday at 6 PM, Monthly on last day at 8 PM</li>
                <li><strong>Regular Pools:</strong> When pool reaches 100% target or on specified end date</li>
              </ul>
              
              <h3 className="font-semibold mt-3">6.2 Draw Fairness</h3>
              <ul className="list-disc pl-6">
                <li>Cryptographically secure random selection</li>
                <li>Blockchain-verified results</li>
                <li>Publicly verifiable for transparency</li>
              </ul>
              
              <h3 className="font-semibold mt-3">6.3 Prize Values</h3>
              <ul className="list-disc pl-6">
                <li><strong>Merkato VIP & City VIP:</strong> Daily 1M ETB, Weekly 10M ETB, Monthly 40M ETB</li>
                <li><strong>Regular Pools:</strong> Cars, houses, machinery, electronics, and more</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">7. Prize Fulfillment (All Programs)</h2>
              <h3 className="font-semibold mt-3">7.1 Delivery Timeframe</h3>
              <p>Within <strong>14 days</strong> of the draw, winners receive their prize or cash equivalent.</p>
              
              <h3 className="font-semibold mt-3">7.2 Cash Equivalent Guarantee</h3>
              <p>If the physical prize is unavailable for any reason, the winner receives the <strong>full cash value</strong> of the prize.</p>
              
              <h3 className="font-semibold mt-3">7.3 Winner's Obligation</h3>
              <ul className="list-disc pl-6">
                <li>Respond within 30 days of winning notification</li>
                <li>Provide valid identification</li>
                <li>Provide TeleBirr number or bank details for cash prizes</li>
              </ul>
              
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">You win 1M ETB in Merkato VIP Daily pool. The money is transferred to your TeleBirr or bank account within 14 days.</p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">8. Commissions (For Agents & Organizers)</h2>
              <h3 className="font-semibold mt-3">8.1 Who Earns?</h3>
              <p>Agents and pool organizers earn <strong>10% commission</strong> on successful pools.</p>
              
              <h3 className="font-semibold mt-3">8.2 When Paid?</h3>
              <p>Within 7 days after the winner confirms receipt of their prize.</p>
              
              <h3 className="font-semibold mt-3">8.3 Payout Methods</h3>
              <ul className="list-disc pl-6">
                <li>TeleBirr (1-3 business days)</li>
                <li>Bank transfer (3-5 business days)</li>
              </ul>
            </section>

            {/* Section 9 - Charity */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">9. Charity Contribution</h2>
              <p><strong>2% of ALL platform income</strong> (from all three programs) goes to support kidney and heart disease patients in Ethiopia.</p>
              <div className="mt-2 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                <p className="text-sm font-semibold">❤️ Your Impact:</p>
                <p className="text-sm">Every contribution to Merkato VIP, City VIP, or Regular Pools helps save lives through dialysis, medications, and surgeries.</p>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">10. Prohibited Conduct</h2>
              <ul className="list-disc pl-6">
                <li>Creating fake or deceptive pools</li>
                <li>Manipulating draws or results</li>
                <li>Using multiple accounts to gain unfair advantage</li>
                <li>Fraudulent payments or chargebacks</li>
                <li>Harassing winners, other users, or platform staff</li>
              </ul>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-red-300">
                <p className="text-sm font-semibold">⚠️ Consequences:</p>
                <p className="text-sm">Violations result in immediate account suspension, forfeiture of funds, and legal action.</p>
              </div>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">11. Account Suspension & Termination</h2>
              <p>The platform reserves the right to suspend or terminate accounts that violate these Terms.</p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">12. Limitation of Liability</h2>
              <p>Abbaa Carraa is a platform connecting participants across all three programs. We are not responsible for disputes between users.</p>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">13. Dispute Resolution</h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li>First, contact us using the information below</li>
                <li>The platform will mediate between parties</li>
                <li>If unresolved, formal mediation in Addis Ababa</li>
                <li>Legal action shall take place in Addis Ababa, Ethiopia, under Ethiopian law</li>
              </ol>
            </section>

            {/* Section 14 - Updated with YOUR contact info only */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">14. Contact Information</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <p className="flex items-center gap-3">
                    <span className="text-xl">📧</span>
                    <span><strong>Email:</strong> hundessanegassa@gmail.com</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="text-xl">📞</span>
                    <span><strong>Phone 1:</strong> 0930330323</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="text-xl">📞</span>
                    <span><strong>Phone 2:</strong> 0913277922</span>
                  </p>
                </div>
              </div>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">15. Modifications to Terms</h2>
              <p>The platform may update these Terms at any time. Continued use constitutes acceptance of updated terms.</p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Abbaa Carraa. All rights reserved.</p>
            <p className="text-xs mt-1">Merkato VIP | City VIP | Regular Pools</p>
          </div>
        </div>
      </div>
    </div>
  );
}
