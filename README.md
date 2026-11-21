# Sexy Plushies Party

One-page site for the Team Sexy Plushies after party in Bari, hosted by Tux and Frollino.

- `public/`: the static page (countdown, Instagram follow cards, plushies that spawn on click)
- `api/reveal.js`: serves the meeting point only after `REVEAL_AT`, so it never ships in the page source

## Config (Vercel env vars)

| Var | Example |
| --- | --- |
| `MEETING_POINT` | `Piazza Mercantile, Bari Vecchia` |
| `MEETING_NOTE` | `Look for the giant penguin.` (optional) |
| `MEETING_MAPS_URL` | full Google Maps link (optional, otherwise built from `MEETING_POINT`) |
| `REVEAL_AT` | `2026-11-21T19:00:00+01:00` (default) |

Deploy: `npx vercel --prod`
