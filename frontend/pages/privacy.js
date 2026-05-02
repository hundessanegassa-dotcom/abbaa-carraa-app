import Link from 'next/link';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Privacy Policy</h1>
          <p className="text-center text-gray-500 mb-8">Last Updated: May 2026</p>

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">1. Information We Collect</h2>
              <h3 className="font-semibold mt-3">Personal Information:</h3>
              <ul className="list-disc pl-6">
                <li>Full name</li>
                <li>Email address</li>
                <li>Phone number (Ethiopian)</li>
                <li>City of residence</li>
                <li>Payment transaction details (processed via Chapa – we do not store card/bank information)</li>
              </ul>
              
              <h3 className="font-semibold mt-3">Usage Data:</h3>
              <ul className="list-disc pl-6">
                <li>Pool participation history</li>
                <li>Contribution amounts and dates</li>
                <li>Wins and losses</li>
                <li>Device information (browser, OS)</li>
                <li>IP address (for security and analytics)</li>
              </ul>
              
              <h3 className="font-semibold mt-3">For Pool Creators (Agents, Vendors):</h3>
              <ul className="list-disc pl-6">
                <li>Business name and registration documents</li>
                <li>TIN number (for commission payouts)</li>
                <li>Product/service listings</li>
                <li>Bank account or Telebirr details (for payouts)</li>
              </ul>
              
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">When you register, we collect: John Doe, john@example.com, 0912345678, Addis Ababa. This allows us to verify your identity and notify you if you win.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Management</strong> – Create and manage your account</li>
                <li><strong>Pool Participation</strong> – Process your contributions and track your entries</li>
                <li><strong>Notifications</strong> – SMS/Email you about draws, wins, and platform updates</li>
                <li><strong>Verification</strong> – Verify your identity for prize claims and agent applications</li>
                <li><strong>Improvement</strong> – Analyze usage to improve our platform and user experience</li>
                <li><strong>Legal Compliance</strong> – Comply with Ethiopian financial and tax regulations</li>
                <li><strong>Fraud Prevention</strong> – Detect and prevent fraudulent activity</li>
              </ul>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">When you win a prize, we use your phone number to send an SMS, your email to send confirmation, and your address for prize delivery coordination with the agent.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">3. Information Sharing</h2>
              <p>We do <strong>not</strong> sell your personal information. We may share information in these limited circumstances:</p>
              <ul className="list-disc pl-6 mt-2">
                <li><strong>With Pool Creators</strong> – Only your pool participation status (not personal details) for prize fulfillment</li>
                <li><strong>With Chapa (Payment Processor)</strong> – Transaction details to process payments</li>
                <li><strong>With Africa's Talking</strong> – Phone numbers to send SMS notifications</li>
                <li><strong>Legal Authorities</strong> – When required by Ethiopian law or legal process</li>
                <li><strong>Service Providers</strong> – Vercel (hosting), Supabase (database)</li>
              </ul>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">When you win a car, we share your name and phone number with the agent so they can contact you for delivery. We never share your payment information.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">4. Data Security</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Encryption at Rest</strong> – All data stored in Supabase is encrypted</li>
                <li><strong>Encryption in Transit</strong> – All data transmitted via HTTPS</li>
                <li><strong>Row Level Security (RLS)</strong> – Database-level security prevents unauthorized access</li>
                <li><strong>Password Hashing</strong> – Passwords are hashed using bcrypt (never stored in plain text)</li>
                <li><strong>PCI Compliance</strong> – Payment information is handled by Chapa (PCI Level 1 certified)</li>
                <li><strong>Regular Audits</strong> – We conduct regular security audits and penetration testing</li>
              </ul>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-green-500">
                <p className="text-sm font-semibold">🔒 Security Promise:</p>
                <p className="text-sm">Your payment information never touches our servers – it goes directly to Chapa's secure payment gateway. We only receive confirmation of successful payment.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">5. Your Rights</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access</strong> – View all personal data we hold about you in your profile</li>
                <li><strong>Correction</strong> – Update your information anytime via profile settings</li>
                <li><strong>Deletion</strong> – Request account deletion by contacting support@abbaacarraa.com</li>
                <li><strong>Opt-out of Marketing</strong> – Unsubscribe from promotional emails via the link in emails</li>
                <li><strong>Data Portability</strong> – Request export of your data in JSON format</li>
                <li><strong>Restrict Processing</strong> – Request limited processing while disputes are resolved</li>
              </ul>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold">📌 Example:</p>
                <p className="text-sm">If you move to a new city, you can update your profile. If you want to delete your account, email support and we will process your request within 7 days.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">6. Cookies and Tracking</h2>
              <p>We use essential cookies for authentication and platform functionality. We do not use third-party tracking cookies for advertising or analytics beyond platform improvement.</p>
              <ul className="list-disc pl-6 mt-2">
                <li><strong>Authentication cookies</strong> – Keep you logged in</li>
                <li><strong>Preference cookies</strong> – Remember your language selection</li>
                <li><strong>Session cookies</strong> – Track your session for security</li>
              </ul>
              <p className="mt-2">You can disable cookies in your browser settings, but this may affect platform functionality.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">7. Children's Privacy</h2>
              <p>Abbaa Carraa is not intended for users under 18 years of age. We do not knowingly collect information from minors. If we discover a user is under 18, we will delete their account immediately.</p>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border-l-4 border-yellow-500">
                <p className="text-sm font-semibold">👨‍👩‍👧‍👦 Parental Notice:</p>
                <p className="text-sm">If you believe your child under 18 has created an account, please contact support@abbaacarraa.com and we will remove it immediately.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">8. Data Retention</h2>
              <ul className="list-disc pl-6">
                <li><strong>Active Accounts</strong> – Data retained as long as your account is active</li>
                <li><strong>Transaction History</strong> – Retained for 7 years as required by Ethiopian financial regulations</li>
                <li><strong>Deleted Accounts</strong> – Personal data removed within 30 days, transaction history anonymized</li>
                <li><strong>Backups</strong> – Encrypted backups retained for up to 30 days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">9. Third-Party Services</h2>
              <p>Our platform integrates with these third-party services (each with their own privacy policies):</p>
              <ul className="list-disc pl-6 mt-2">
                <li><strong>Supabase</strong> – Database, authentication, storage (https://supabase.com/privacy)</li>
                <li><strong>Chapa</strong> – Payment processing (https://chapa.co/privacy-policy)</li>
                <li><strong>Africa's Talking</strong> – SMS notifications (https://africastalking.com/legal/privacy)</li>
                <li><strong>Vercel</strong> – Application hosting (https://vercel.com/legal/privacy-policy)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">10. International Data Transfers</h2>
              <p>Our servers are hosted by Vercel and Supabase, which may have infrastructure outside Ethiopia. By using our platform, you consent to your data being transferred to and processed in countries where our service providers operate.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">11. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify users of significant changes via:</p>
              <ul className="list-disc pl-6 mt-2">
                <li>Email notification (to registered email)</li>
                <li>Platform notification (on next login)</li>
                <li>Website banner announcement</li>
              </ul>
              <p className="mt-2">The "Last Updated" date at the top of this page will reflect the latest version.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-green-700 mb-3">12. Contact Us</h2>
              <p>For privacy-related questions, concerns, or data requests, please contact us:</p>
              <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                <p><strong>Email:</strong> <a href="mailto:privacy@abbaacarraa.com" className="text-green-600">privacy@abbaacarraa.com</a></p>
                <p className="mt-1"><strong>Data Protection Officer:</strong> privacy@abbaacarraa.com</p>
                <p className="mt-1"><strong>Address:</strong> Addis Ababa, Ethiopia</p>
                <p className="mt-1"><strong>Response Time:</strong> We respond to all privacy requests within 7 business days.</p>
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
