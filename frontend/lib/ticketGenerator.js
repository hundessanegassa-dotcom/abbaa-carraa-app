// lib/ticketGenerator.js - Client-safe wrapper (actual generation on server)
// This file only contains the ticket data formatting

export function createTicketData({
  participant,
  programType,
  tier,
  seatNumbers,
  ticketNumber,
  amount,
  prize,
  language = 'am',
  isVerified = true
}) {
  // Return data structure for server-side generation
  return {
    participant,
    programType,
    tier,
    seatNumbers,
    ticketNumber,
    amount,
    prize,
    language,
    isVerified
  };
}

// Client-side function to call API for ticket generation
export async function generateTicketImage(ticketData) {
  try {
    const response = await fetch('/api/generate-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.imageUrl; // Returns data URL of generated ticket
  } catch (error) {
    console.error('Error generating ticket:', error);
    throw error;
  }
}
