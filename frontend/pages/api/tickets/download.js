// pages/api/tickets/download.js - NEW
import { supabase } from '../../../lib/supabase';
import { generateTicketImage } from '../../../lib/ticketGenerator';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ticketNumber, format = 'png' } = req.query;

  if (!ticketNumber) {
    return res.status(400).json({ error: 'Ticket number required' });
  }

  try {
    // Search in all three tables
    let ticket = null;
    let programType = 'regular';

    // Check merkato_vip_participants
    const { data: merkatoData } = await supabase
      .from('merkato_vip_participants')
      .select('*')
      .eq('ticket_number', ticketNumber)
      .single();

    if (merkatoData) {
      ticket = merkatoData;
      programType = 'merkato';
    } else {
      // Check city_vip_participants
      const { data: cityData } = await supabase
        .from('city_vip_participants')
        .select('*')
        .eq('ticket_number', ticketNumber)
        .single();

      if (cityData) {
        ticket = cityData;
        programType = 'city';
      } else {
        // Check regular_pool_participants
        const { data: regularData } = await supabase
          .from('regular_pool_participants')
          .select('*')
          .eq('ticket_number', ticketNumber)
          .single();

        if (regularData) {
          ticket = regularData;
          programType = 'regular';
        }
      }
    }

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Update download count
    await supabase
      .from(`${programType}_vip_participants`)
      .update({
        png_download_count: supabase.sql`png_download_count + 1`,
        last_download_at: new Date().toISOString()
      })
      .eq('ticket_number', ticketNumber);

    // Generate image
    const imageBuffer = await generateTicketImage({
      participant: ticket,
      programType,
      tier: ticket.tier,
      seatNumbers: ticket.seat_numbers,
      ticketNumber: ticket.ticket_number,
      amount: ticket.contribution_amount,
      prize: ticket.prize_amount,
      language: 'am'
    });

    const contentType = format === 'png' ? 'image/png' : 'image/jpeg';
    const extension = format === 'png' ? 'png' : 'jpg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=ticket-${ticketNumber}.${extension}`);
    res.send(imageBuffer);

  } catch (error) {
    console.error('Ticket download error:', error);
    res.status(500).json({ error: 'Failed to generate ticket' });
  }
}
