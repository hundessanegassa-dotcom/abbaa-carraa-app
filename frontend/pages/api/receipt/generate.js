import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contributionId, userId } = req.body;

  try {
    // Fetch contribution details
    const { data: contribution, error: contribError } = await supabase
      .from('contributions')
      .select('*, pools(*)')
      .eq('id', contributionId)
      .single();

    if (contribError) throw contribError;

    // Fetch user profile
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Generate PDF (using @react-pdf/renderer on server)
    const { default: ReceiptPDF } = await import('../../../components/ReceiptPDF');
    const ReactPDF = await import('@react-pdf/renderer');

    const pdfStream = await ReactPDF.renderToStream(
      ReactPDF.default.createElement(ReceiptPDF, {
        contribution: contribution,
        pool: contribution.pools,
        user: user,
        transaction: contribution
      })
    );

    // Return PDF as download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${contributionId}.pdf`);
    
    pdfStream.pipe(res);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate receipt' });
  }
}
