// Gatekeeper for the meeting point: it lives only in env vars and is served once REVEAL_AT has passed.
const REVEAL_AT = process.env.REVEAL_AT || '2026-11-21T19:00:00+01:00';

module.exports = (req, res) => {
  const revealAt = Date.parse(REVEAL_AT);
  const now = Date.now();
  res.setHeader('Cache-Control', 'no-store');
  if (now < revealAt) {
    res.status(423).json({ revealed: false, revealAt, now });
    return;
  }
  const place = process.env.MEETING_POINT || 'Meeting point coming in hot. Refresh in a minute.';
  const query = process.env.MEETING_MAPS_QUERY || place;
  res.status(200).json({
    revealed: true,
    revealAt,
    now,
    place,
    note: process.env.MEETING_NOTE || '',
    maps: process.env.MEETING_MAPS_URL || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
  });
};
