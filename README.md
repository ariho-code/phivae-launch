# phivae.com — launch page

A single-page holding site for **phivae.com** while the full site is built.
Static HTML/CSS/JS plus one serverless function that emails launch-list signups.

## What's on it

- The Phivae mark, the headline promise, and a countdown to opening
- **Tasobya** — cover art linking straight to Spotify, plus the Spotify player
- What the finished site will do: tickets, store, releases, news
- Launch-list signup (email only)
- Links to Spotify, Apple Music, YouTube, Instagram and TikTok

Copy leads with what visitors actually get rather than the "launching soon"
pattern, and the signup takes one field — every extra field costs signups.

One centred column at every width — gutters verified symmetric from 320px to
1920px. No cards, no icon font: every mark is inline SVG, so the page pulls in
nothing but the webfont. The background is pure CSS — three drifting colour
pools, a grain overlay and a vignette, nothing to download.

## Moving the countdown

One line, at the top of `app.js`:

```js
var LAUNCH_AT = '2026-09-11T17:00:00Z';
```

ISO 8601 with a timezone. `Z` is UTC and Uganda is UTC+3, so `17:00Z` is
**20:00 in Kampala**. When it reaches zero the digits hold at `00:00:00` and
the status flips to "Launching now".

## Layout

```
index.html          the page
styles.css          all styling; design tokens at the top of the file
app.js              countdown + signup form
api/subscribe.js    serverless signup endpoint
devserver.py        local preview only, never deployed
assets/             logo, cover art, favicon (94 KB total)
```

No build step and no framework.

## Where signups go

`POST /api/subscribe` emails each signup straight to the inbox below. **There is
no database** — the email is the record, and the list is whatever is in that
inbox. Set these in Vercel → Project → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `SMTP_USER` | the Gmail address to send from |
| `SMTP_PASS` | a Gmail **app password**, not the account password |
| `NOTIFY_TO` | where signups land (optional; defaults to `SMTP_USER`) |

Redeploy after adding them.

**Until they are set the form does not accept signups** — it returns a 503 and
points visitors at Instagram instead. That is deliberate: it never tells someone
they are subscribed when nothing was recorded. Every attempt is also written to
the Vercel function log as a fallback.

## Local preview

```sh
python3 devserver.py       # http://127.0.0.1:8899
```

`devserver.py` serves the page and stands in for the signup endpoint, writing to
`subscribers.local.jsonl` so the form can be exercised end to end offline. It is
a development tool only; production uses `api/subscribe.js`.

## Notes

- The track is titled **Tasobya** on Spotify. Correct it here and on the
  streaming platforms together if that spelling is wrong.
- The logo is derived from the artwork on the black background, with alpha taken
  from luminance, so it sits on any dark surface without a halo.
