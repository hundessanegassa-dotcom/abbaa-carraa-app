// This file ensures all routes are treated as dynamic
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function handler(req, res) {
  res.status(200).json({ status: 'ok' });
}
