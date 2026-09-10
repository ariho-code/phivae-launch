import nodemailer from 'nodemailer';

/**
 * Launch-list signup.
 *
 * Each signup is emailed to NOTIFY_TO, which is the durable record — a
 * serverless function has no filesystem to keep one in. Configure:
 *
 *   SMTP_USER   Gmail address to send from
 *   SMTP_PASS   Gmail app password (not the account password)
 *   NOTIFY_TO   where signups land (defaults to SMTP_USER)
 *
 * Without those the endpoint reports that signup is not switched on rather
 * than telling a visitor they are subscribed when nothing was recorded.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ success: false, error: 'Could not read that request.' });
    }
  }

  const name = clean(body?.name, 120);
  const email = clean(body?.email, 200).toLowerCase();

  if (!name) {
    return res.status(400).json({ success: false, error: 'Add your name so we know who to greet.' });
  }

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ success: false, error: 'That email address doesn’t look right.' });
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.NOTIFY_TO || user;

  // Logged either way, so a signup is never lost purely to missing config.
  console.log('[launch-signup]', JSON.stringify({ name, email, at: new Date().toISOString() }));

  if (!user || !pass) {
    return res.status(503).json({
      success: false,
      error: 'Signup isn’t switched on yet. Follow @itsphivae on Instagram and we’ll shout there too.',
    });
  }

  try {
    const transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user, pass },
    });

    await transport.sendMail({
      from: `Phivae Launch <${user}>`,
      to,
      replyTo: email,
      subject: `Launch list: ${name}`,
      text: `${name} <${email}> signed up for the launch alert.`,
      html:
        '<div style="font-family:system-ui,sans-serif;line-height:1.6">' +
        '<h2 style="margin:0 0 12px">New launch-list signup</h2>' +
        `<p style="margin:0"><strong>${escapeHtml(name)}</strong><br>` +
        `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>` +
        `<p style="color:#777;font-size:13px;margin:16px 0 0">${new Date().toUTCString()}</p>` +
        '</div>',
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[launch-signup] send failed:', error?.message || error);
    return res.status(502).json({
      success: false,
      error: 'We couldn’t save that just now. Please try again shortly.',
    });
  }
}
