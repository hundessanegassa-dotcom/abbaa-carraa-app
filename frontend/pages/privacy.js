export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last Updated: April 16, 2026</p>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-bold mb-3">1. Information We Collect</h2>
              <p className="text-gray-700 mb-2">We collect information you provide directly to us:</p>
              <ul className="list-disc list-inside text-gray-700 ml-4">
                <li>Name, email address, phone number</li>
                <li>Payment information (processed securely via Telebirr/CBE)</li>
                <li>Transaction history and pool participation</li>
                <li>Communications with us</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-gray-700 ml-4">
                <li>Process your contributions and pool entries</li>
                <li>Notify you of draws, winners, and platform updates</li>
                <li>Verify your identity and prevent fraud</li>
                <li>Improve our platform and user experience</li>
                <li>Send newsletters (with your consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">3. Data Security</h2>
              <p className="text-gray-700">
                We implement industry-standard security measures including encryption, 
                secure servers, and regular security audits. Your payment information 
                is never stored on our servers - it's processed directly by Telebirr and CBE Birr.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">4. Data Sharing</h2>
              <p className="text-gray-700">
                We do not sell your personal information. We may share data with:
              </p>
              <ul className="list-disc list-inside text-gray-700 ml-4 mt-2">
                <li>Payment processors (Telebirr, CBE Birr)</li>
                <li>Legal authorities when required by law</li>
                <li>Agents (only your pool participation, not personal details)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">5. Your Rights</h2>
              <p className="text-gray-700">
                You have the right to access, correct, or delete your personal information. 
                You may also unsubscribe from marketing communications at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">6. Cookies</h2>
              <p className="text-gray-700">
                We use cookies to remember your preferences, analyze site traffic, 
                and improve your experience. You can disable cookies in your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">7. Children's Privacy</h2>
              <p className="text-gray-700">
                Our platform is not intended for users under 18. We do not knowingly 
                collect information from minors.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">8. Data Retention</h2>
              <p className="text-gray-700">
                We retain your information for as long as your account is active or as 
                needed to provide services. Transaction records are kept for 7 years as 
                required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">9. Contact Us</h2>
              <p className="text-gray-700">
                For privacy concerns, contact: privacy@abbaacarraa.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
