// pages/api/newsletter/welcome.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { email, name } = req.body;
  
  // You can integrate with email services like:
  // - Resend (recommended for Next.js)
  // - SendGrid
  // - AWS SES
  // - Brevo (formerly Sendinblue)
  
  // Example with Resend (you'll need to install: npm install resend)
  /*
  import { Resend } from 'resend';
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: 'Abbaa Carraa <newsletter@abbaacarraa.com>',
    to: email,
    subject: 'Welcome to Abbaa Carraa Newsletter!',
    html: `
      <h1>Welcome, ${name || 'there'}! 🎉</h1>
      <p>Thank you for subscribing to the Abbaa Carraa newsletter.</p>
      <p>You'll now receive updates about:</p>
      <ul>
        <li>🎯 New prize pools</li>
        <li>🏆 Recent winners</li>
        <li>💰 Exclusive offers</li>
        <li>💚 Charity impact updates</li>
      </ul>
      <p>Stay tuned for amazing opportunities!</p>
      <p>- The Abbaa Carraa Team</p>
    `
  });
  */
  
  res.status(200).json({ success: true });
}
