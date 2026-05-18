import BackButton from '../components/BackButton';
import Link from 'next/link';

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
              <p className="mb-3">Welcome to Abbaa Carraa ("Platform", "We", "Us", "Our"). By accessing or using our platform, you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree, please do not use the platform.</p>
              <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">When you register an account or contribute to a pool, you are automatically agreeing to these Terms. We recommend reading them carefully before participating.</p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">2. Definitions</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    <tr className="border-b"><td className="py-2 font-semibold w-40">"Platform"</td><td className="py-2">Abbaa Carraa website and services</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">"Pool"</td><td className="py-2">A prize collection where users contribute toward a collective fund</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">"Contributor"</td><td className="py-2">A user who pays into a pool</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">"Pool Creator"</td><td className="py-2">Any user (agent, vendor, organization, individual) who creates a pool</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">"Winner"</td><td className="py-2">The contributor randomly selected when a pool reaches its target</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">"Commission"</td><td className="py-2">10% of the total pool collection paid to the pool creator</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">"Target Amount"</td><td className="py-2">The prize value that the winner receives</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">"Cash Equivalent"</td><td className="py-2">The cash value of the prize if the physical prize is unavailable</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">3. Eligibility</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Must be 18 years or older</li>
                <li>Must have a valid Ethiopian phone number</li>
                <li>Must provide accurate registration information</li>
                <li>One account per person (duplicate accounts may be suspended)</li>
              </ul>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">If you create multiple accounts to increase your chances of winning, all your accounts will be suspended and contributions forfeited.</p>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">4. Creating a Prize Pool</h2>
              <h3 className="font-semibold mt-3">4.1 Who Can Create?</h3>
              <p>Any registered user – agent, vendor, organization, or individual – can create a prize pool.</p>
              
              <h3 className="font-semibold mt-3">4.2 Listing Requirements</h3>
              <ul className="list-disc pl-6">
                <li>Accurate prize description (no misleading information)</li>
                <li>Realistic target amount (winner receives this value)</li>
                <li>Clear images of the prize (if applicable)</li>
                <li>No counterfeit, stolen, or illegal items</li>
              </ul>
              
              <h3 className="font-semibold mt-3">4.3 No Listing Fees</h3>
              <p>Creating a pool is <strong>completely free</strong>. There are no upfront costs or subscription fees.</p>
              
              <h3 className="font-semibold mt-3">4.4 Commission Structure</h3>
              <p>Pool creators add 20% on top of the target amount. The creator earns <strong>10% commission</strong> on the total pool collection when the pool completes.</p>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">Target: 500,000 ETB (winner receives)<br/>
                Add 20% commission: +100,000 ETB<br/>
                Total collected: 600,000 ETB<br/>
                Creator earns: 100,000 ETB commission</p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">5. Contributing to a Pool</h2>
              <h3 className="font-semibold mt-3">5.1 How to Contribute</h3>
              <ol className="list-decimal pl-6 space-y-1">
                <li>Select an active pool</li>
                <li>Choose how many seats/tickets you want</li>
                <li>Pay via Telebirr or CBE Birr</li>
                <li>Receive instant confirmation</li>
              </ol>
              
              <h3 className="font-semibold mt-3">5.2 Ticket System</h3>
              <p>Each contribution buys tickets proportional to the amount. More tickets = higher chance of winning.</p>
              
              <h3 className="font-semibold mt-3">5.3 Non-Refundable</h3>
              <p>All contributions are <strong>final and non-refundable</strong> once a pool is active. This is like buying a raffle ticket – you cannot change your mind after purchase.</p>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-red-300">
                <p className="text-sm font-semibold">⚠️ Important:</p>
                <p className="text-sm">If you contribute 1,000 ETB to a pool, you cannot request a refund, even if you later decide not to participate.</p>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">6. Prize Draws</h2>
              <h3 className="font-semibold mt-3">6.1 When Draws Occur</h3>
              <ul className="list-disc pl-6">
                <li>Automatically when pool reaches 100% target</li>
                <li>Or on the specified end date (if target not reached, pool may be extended)</li>
              </ul>
              
              <h3 className="font-semibold mt-3">6.2 Draw Fairness</h3>
              <ul className="list-disc pl-6">
                <li>Cryptographically secure random seed</li>
                <li>Publicly verifiable results</li>
                <li>Admin oversight and audit trail</li>
              </ul>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">The draw uses a random seed based on the Bitcoin block hash at the time of the draw – completely unpredictable and verifiable by anyone.</p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">7. Prize Fulfillment</h2>
              <h3 className="font-semibold mt-3">7.1 Pool Creator's Obligation</h3>
              <p>Within <strong>14 days</strong> of the draw, the pool creator must provide:</p>
              <ul className="list-disc pl-6 mt-2">
                <li><strong>If creator has the physical product</strong> → Deliver actual product to winner</li>
                <li><strong>If creator does not have the product</strong> → Pay cash equivalent of target amount</li>
                <li><strong>If product is unavailable</strong> → Pay cash equivalent</li>
              </ul>
              
              <h3 className="font-semibold mt-3">7.2 Winner's Obligation</h3>
              <ul className="list-disc pl-6">
                <li>Respond within 30 days of notification</li>
                <li>Provide valid identification</li>
                <li>Arrange delivery/pickup or provide bank/Telebirr details for cash prizes</li>
              </ul>
              
              <h3 className="font-semibold mt-3">7.3 Failure to Fulfill</h3>
              <p>If a pool creator fails to deliver the prize or cash equivalent:</p>
              <ul className="list-disc pl-6">
                <li>Platform may ban the creator permanently</li>
                <li>Legal action may be pursued</li>
                <li>Commission is forfeited</li>
                <li>Platform may payout the winner from commission reserves</li>
              </ul>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">You win a car pool. The agent has the car. They deliver it within 14 days. If they don't, the platform steps in and you receive 500,000 ETB cash instead.</p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">8. Commissions</h2>
              <h3 className="font-semibold mt-3">8.1 Who Earns?</h3>
              <p>Any pool creator earns <strong>10% commission</strong> on the total pool collection.</p>
              
              <h3 className="font-semibold mt-3">8.2 When Paid?</h3>
              <ul className="list-disc pl-6">
                <li>After the winner receives their prize</li>
                <li>Paid within 7 days of fulfillment confirmation</li>
              </ul>
              
              <h3 className="font-semibold mt-3">8.3 Payout Methods</h3>
              <ul className="list-disc pl-6">
                <li>Telebirr (1-3 business days)</li>
                <li>Bank transfer (3-5 business days)</li>
                <li>Cash pickup (by appointment)</li>
              </ul>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">You earn 100,000 ETB commission. You choose Telebirr payout. The money arrives in your Telebirr account within 3 business days.</p>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">9. Discounts for Non-Winners</h2>
              <p>Pool creators may offer discount codes (5-50%) to non-winners:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Valid for 30 days after pool completion</li>
                <li>One-time use per participant</li>
                <li>Cannot be combined with other offers</li>
                <li>Discount applies to purchases from the pool creator's business</li>
              </ul>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">A furniture shop offers 20% discount to all non-winners. You participated but didn't win. You get a 20% discount code valid for 30 days at their shop.</p>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">10. Verification Requirements</h2>
              <ul className="list-disc pl-6">
                <li>All pool creators must verify their identity</li>
                <li>Businesses must provide registration documents (TIN, business license)</li>
                <li>Vendors may need dealer license (for cars, heavy machinery, real estate)</li>
                <li>Verification takes 24-48 hours</li>
              </ul>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">11. Prohibited Conduct</h2>
              <ul className="list-disc pl-6">
                <li>Creating fake or deceptive pools</li>
                <li>Manipulating draws or results</li>
                <li>Using multiple accounts to gain unfair advantage</li>
                <li>Fraudulent payments or chargebacks</li>
                <li>Harassing winners, other users, or platform staff</li>
                <li>Listing counterfeit or stolen items</li>
              </ul>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-red-300">
                <p className="text-sm font-semibold">⚠️ Consequences:</p>
                <p className="text-sm">Violations may result in immediate account suspension, forfeiture of commissions, and legal action.</p>
              </div>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">12. Account Suspension & Termination</h2>
              <p>The platform reserves the right to suspend or terminate accounts that violate these Terms. Reasons include:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Fraudulent activity</li>
                <li>Abuse of other users</li>
                <li>Violation of Ethiopian laws</li>
                <li>Non-delivery of prizes (for creators)</li>
              </ul>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">13. Limitation of Liability</h2>
              <p>Abbaa Carraa is a platform connecting pool creators and contributors. We are not responsible for:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Disputes between creators and winners</li>
                <li>Quality or condition of physical prizes</li>
                <li>Delays in delivery caused by creators</li>
                <li>Third-party payment processor issues (Telebirr, CBE Birr, Chapa)</li>
                <li>Technical issues beyond our reasonable control</li>
              </ul>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">14. Dispute Resolution</h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li>First, contact support@abbaacarraa.com with your dispute</li>
                <li>The platform will mediate between parties</li>
                <li>If unresolved, formal mediation in Addis Ababa</li>
                <li>As a last resort, legal action shall take place in Addis Ababa, Ethiopia, under Ethiopian law</li>
              </ol>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">15. Modifications to Terms</h2>
              <p>The platform may update these Terms at any time. Continued use of the platform constitutes acceptance of the updated terms. We will notify users of significant changes via email or platform notification.</p>
            </section>

            {/* Section 16 */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">16. Contact Information</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b"><td className="py-2 font-semibold">General Support</td><td className="py-2">support@abbaacarraa.com</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">Agent Relations</td><td className="py-2">agents@abbaacarraa.com</td></tr>
                    <tr className="border-b"><td className="py-2 font-semibold">Admin Issues</td><td className="py-2">admin@abbaacarraa.com</td></tr>
                    <tr><td className="py-2 font-semibold">Legal/Compliance</td><td className="py-2">legal@abbaacarraa.com</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
            <p>© 2026 Abbaa Carraa. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
