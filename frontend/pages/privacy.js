// pages/privacy.js - UPDATED WITH ALL THREE PROGRAMS
import BackButton from '../components/BackButton';
import Link from 'next/link';

export async function getServerSideProps() {
  return { props: {} };
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-4"><BackButton /></div>
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Privacy Policy</h1>
          <p className="text-center text-gray-500 mb-8">Last Updated: May 2026</p>

          <div className="space-y-8 text-gray-700">
            
            {/* Program Overview */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">Our Three Programs</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-center">
                  <div className="text-2xl">🏪</div>
                  <p className="font-semibold text-sm">Merkato VIP</p>
                  <p className="text-xs">Daily, Weekly, Monthly prizes up to 40M ETB</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                  <div className="text-2xl">🏙️</div>
                  <p className="font-semibold text-sm">City VIP</p>
                  <p className="text-xs">94+ Ethiopian cities, prizes up to 40M ETB</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                  <div className="text-2xl">🏊</div>
                  <p className="font-semibold text-sm">Regular Pools</p>
                  <p className="text-xs">Cars, houses, electronics & more</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">This Privacy Policy applies to all three programs equally.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">1. Information We Collect</h2>
              <h3 className="font-semibold mt-3">Personal Information:</h3>
              <ul className="list-disc pl-6">
                <li>Full name</li>
                <li>Email address</li>
                <li>Phone number (Ethiopian)</li>
                <li>City of residence</li>
                <li>Payment transaction details (processed via secure gateway – we do not store card/bank information)</li>
                <li>Program participation history (Merkato VIP, City VIP, or Regular Pools)</li>
              </ul>
              
              <h3 className="font-semibold mt-3">Usage Data:</h3>
              <ul className="list-disc pl-6">
                <li>Pool participation across all programs</li>
                <li>Contribution amounts and dates</li>
                <li>Wins and losses in any program</li>
                <li>Device information (browser, OS)</li>
                <li>IP address (for security and analytics)</li>
              </ul>
              
              <h3 className="font-semibold mt-3">For Agents & Organizers:</h3>
              <ul className="list-disc pl-6">
                <li>Business name and registration documents</li>
                <li>TIN number (for commission payouts)</li>
                <li>Bank account or Telebirr details (for payouts)</li>
              </ul>
              
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">When you join Merkato VIP Daily pool or your City VIP program, we collect your name, phone, and city to verify eligibility and notify you if you win.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Management</strong> – Create and manage your account for all programs</li>
                <li><strong>Program Participation</strong> – Process your contributions to Merkato VIP, City VIP, or Regular Pools</li>
                <li><strong>Notifications</strong> – SMS/Email you about draws, wins, and program updates</li>
                <li><strong>Verification</strong> – Verify your identity for prize claims</li>
                <li><strong>Improvement</strong> – Analyze usage to improve all three programs</li>
                <li><strong>Legal Compliance</strong> – Comply with Ethiopian financial regulations</li>
                <li><strong>Fraud Prevention</strong> – Detect and prevent fraudulent activity across all programs</li>
              </ul>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">When you win 10M ETB in City VIP weekly pool, we use your phone to send SMS, your email for confirmation, and your city to announce the winner.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">3. Information Sharing</h2>
              <p>We do <strong>not</strong> sell your personal information. We may share information in these limited circumstances:</p>
              <ul className="list-disc pl-6 mt-2">
                <li><strong>With Program Organizers</strong> – Only your participation status for prize fulfillment</li>
                <li><strong>With Payment Processors</strong> – Transaction details to process payments</li>
                <li><strong>With SMS Providers</strong> – Phone numbers to send winning notifications</li>
                <li><strong>Legal Authorities</strong> – When required by Ethiopian law</li>
                <li><strong>Service Providers</strong> – Hosting, database, and analytics services</li>
              </ul>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">When you win a Regular Pool car, we share your name and phone with the organizer for delivery. We never share your payment information.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">4. Data Security</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Encryption at Rest</strong> – All data stored is encrypted</li>
                <li><strong>Encryption in Transit</strong> – All data transmitted via HTTPS</li>
                <li><strong>Row Level Security (RLS)</strong> – Database-level security prevents unauthorized access</li>
                <li><strong>Password Hashing</strong> – Passwords are hashed (never stored in plain text)</li>
                <li><strong>Secure Payments</strong> – Payment information is handled by secure payment gateways</li>
                <li><strong>Regular Audits</strong> – We conduct regular security audits</li>
              </ul>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                <p className="text-sm font-semibold">🔒 Security Promise:</p>
                <p className="text-sm">Your payment information never touches our servers – it goes directly to secure payment gateways. We only receive confirmation of successful payment.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">5. Your Rights</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access</strong> – View all personal data we hold about you</li>
                <li><strong>Correction</strong> – Update your information anytime via profile settings</li>
                <li><strong>Deletion</strong> – Request account deletion by contacting us</li>
                <li><strong>Opt-out of Marketing</strong> – Unsubscribe from promotional emails</li>
                <li><strong>Data Portability</strong> – Request export of your data</li>
              </ul>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">If you move to a new city, you can update your profile to join that city's City VIP program.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">6. Cookies and Tracking</h2>
              <p>We use essential cookies for authentication and platform functionality. We do not use third-party tracking cookies for advertising.</p>
              <ul className="list-disc pl-6 mt-2">
                <li><strong>Authentication cookies</strong> – Keep you logged in</li>
                <li><strong>Preference cookies</strong> – Remember your program preferences</li>
                <li><strong>Session cookies</strong> – Track your session for security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">7. Children's Privacy</h2>
              <p>Abbaa Carraa is not intended for users under 18 years of age. We do not knowingly collect information from minors. If we discover a user is under 18, we will delete their account immediately.</p>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-yellow-500">
                <p className="text-sm font-semibold">👨‍👩‍👧‍👦 Parental Notice:</p>
                <p className="text-sm">If you believe your child under 18 has created an account, please contact us and we will remove it immediately.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">8. Data Retention</h2>
              <ul className="list-disc pl-6">
                <li><strong>Active Accounts</strong> – Data retained as long as your account is active</li>
                <li><strong>Transaction History</strong> – Retained for 7 years as required by Ethiopian financial regulations</li>
                <li><strong>Deleted Accounts</strong> – Personal data removed within 30 days, transaction history anonymized</li>
                <li><strong>Winning Records</strong> – Retained for public transparency and legal compliance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">9. Third-Party Services</h2>
              <p>Our platform integrates with these third-party services (each with their own privacy policies):</p>
              <ul className="list-disc pl-6 mt-2">
                <li><strong>Supabase</strong> – Database and authentication</li>
                <li><strong>Payment Gateway</strong> – Secure payment processing</li>
                <li><strong>SMS Service</strong> – Winning notifications</li>
                <li><strong>Hosting Provider</strong> – Application hosting</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">10. Charity Contribution Transparency</h2>
              <p><strong>2% of ALL platform income</strong> (from Merkato VIP, City VIP, and Regular Pools) goes to support kidney and heart disease patients in Ethiopia.</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Donation records are maintained for transparency</li>
                <li>Quarterly reports available upon request</li>
                <li>Beneficiary information is kept confidential</li>
              </ul>
              <div className="mt-2 p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                <p className="text-sm font-semibold">❤️ Your Impact:</p>
                <p className="text-sm">Every contribution to any program helps save lives through dialysis, medications, and surgeries.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">11. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify users of significant changes via:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Email notification (to registered email)</li>
                <li>Platform notification (on next login)</li>
                <li>Website banner announcement</li>
              </ul>
              <p className="mt-2">The "Last Updated" date at the top of this page reflects the latest version.</p>
            </section>

            {/* Updated Contact Section - YOUR INFO ONLY */}
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">12. Contact Us</h2>
              <p>For privacy-related questions, concerns, or data requests, please contact us:</p>
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <p className="flex items-center gap-3 mb-2">
                  <span className="text-xl">📧</span>
                  <span><strong>Email:</strong> <a href="mailto:hundessanegassa@gmail.com" className="text-green-600">hundessanegassa@gmail.com</a></span>
                </p>
                <p className="flex items-center gap-3 mb-2">
                  <span className="text-xl">📞</span>
                  <span><strong>Phone 1:</strong> 0930330323</span>
                </p>
                <p className="flex items-center gap-3 mb-2">
                  <span className="text-xl">📞</span>
                  <span><strong>Phone 2:</strong> 0913277922</span>
                </p>
                <p className="flex items-center gap-3">
                  <span className="text-xl">📍</span>
                  <span><strong>Address:</strong> Addis Ababa, Ethiopia</span>
                </p>
                <p className="mt-3 text-sm text-gray-500 border-t pt-3">
                  <strong>Response Time:</strong> We respond to all privacy requests within 7 business days.
                </p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} Abbaa Carraa. All rights reserved.</p>
            <p className="text-xs mt-1">Merkato VIP | City VIP | Regular Pools</p>
            <p className="text-xs mt-1 text-green-600">💚 2% for Kidney & Heart Disease Patients</p>
          </div>
        </div>
      </div>
    </div>
  );
}
