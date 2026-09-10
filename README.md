# phivae.com — launch page

A single-page holding site for **phivae.com** while the full site is built.
Static HTML/CSS/JS plus one serverless function for launch-list signups.

## What's on it

- Hero with the Phivae mark, a "launching soon" status and the studio portrait
- **Tasobya** — cover art, the Spotify embed, and a direct link to the track
- Launch-list signup (name + email)
- Links to Spotify, Apple Music, YouTube, Instagram and TikTok

## Layout

```
index.html          the page
styles.css          all styling; design tokens at the top of the file
app.js              signup form handling
api/subscribe.js    serverless signup endpoint
assets/             logo, portrait, cover art, favicon (312 KB total)
```

No build step and no framework. Vercel serves the static files and runs
`api/subscribe.js` as a Node function.

## Signup endpoint — configuration required

`POST /api/subscribe` takes `{ name, email }` and emails the signup to you.
A serverless function has no filesystem, so **the email is the record**. Set
these in Vercel → Project → Settings → Environment Variables:

| Variable | Value |
|---|---|
| `SMTP_USER` | the Gmail address to send from |
| `SMTP_PASS` | a Gmail **app password**, not the account password |
| `NOTIFY_TO` | where signups land (optional; defaults to `SMTP_USER`) |

Redeploy after adding them.

**Until they are set the form does not accept signups** — it returns a 503 and
tells the visitor to follow on Instagram instead. That is deliberate: it never
tells someone they are subscribed when nothing was recorded. Every attempt is
also written to the function log as a fallback.

## Local preview

```sh
python3 -m http.server 8899
```

Then open <http://127.0.0.1:8899>. The signup endpoint does not run under a
plain static server — use `vercel dev` if you need to exercise it.

## Notes

- The track is titled **Tasobya** on Spotify. Correct it here and on the
  streaming platforms together if that spelling is wrong.
- No launch date is shown, because none was set. Adding a countdown is a small
  change once there is a date to count to.
- The logo is derived from the supplied artwork with the black background
  removed, so it sits on any dark surface without a halo.
