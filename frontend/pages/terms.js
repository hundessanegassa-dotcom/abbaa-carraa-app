export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
          <p className="text-gray-500 mb-8">Last Updated: April 16, 2026</p>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-bold mb-3">1. Introduction</h2>
              <p className="text-gray-700">
                Welcome to Abbaa Carraa ("Platform"). By accessing or using our platform, you agree to be bound by these Terms & Conditions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">2. Definitions</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>"Pool"</strong> - A prize collection where users contribute funds</li>
                <li><strong>"Agent"</strong> - A registered business or individual who creates pools</li>
                <li><strong>"Contributor"</strong> - A user who contributes to a pool</li>
                <li><strong>"Draw"</strong> - The random selection of a winner</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">3. Eligibility</h2>
              <p className="text-gray-700">
                You must be at least 18 years old and a resident of Ethiopia to participate. 
                By using this platform, you confirm that all information provided is accurate.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">4. How Pools Work</h2>
              <p className="text-gray-700 mb-3">
                Each pool has a target amount and contribution amount. When the target is reached, 
                a cryptographically secure random draw selects a winner.
              </p>
              <ul className="list-disc list-inside text-gray-700 ml-4">
                <li>All contributions are final and non-refundable</li>
                <li>Draw results are verifiable and transparent</li>
                <li>Winners are notified via SMS and email</li>
                <li>Prizes must be claimed within 30 days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">5. Agent Terms</h2>
              <p className="text-gray-700">
                Agents earn 10% commission on pools they create. Agents must:
              </p>
              <ul className="list-disc list-inside text-gray-700 ml-4 mt-2">
                <li>Provide accurate business information</li>
                <li>Deliver prizes promptly to winners</li>
                <li>Honor discounts offered to participants</li>
                <li>Comply with all applicable laws</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">6. Payment Terms</h2>
              <p className="text-gray-700">
                All payments are processed through Telebirr or CBE Birr. By making a contribution, 
                you authorize the transaction and agree to the payment provider's terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">7. Limitation of Liability</h2>
              <p className="text-gray-700">
                Abbaa Carraa is not responsible for delays or failures caused by circumstances beyond 
                our reasonable control, including payment processing issues or technical problems.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">8. Termination</h2>
              <p className="text-gray-700">
                We reserve the right to suspend or terminate accounts that violate these terms, 
                engage in fraudulent activity, or abuse the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">9. Changes to Terms</h2>
              <p className="text-gray-700">
                We may update these terms at any time. Continued use of the platform constitutes 
                acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">10. Contact</h2>
              <p className="text-gray-700">
                Questions about these terms? Contact us at legal@abbaacarraa.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
