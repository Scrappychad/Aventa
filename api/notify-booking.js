// /api/notify-booking
//
// Vercel serverless function. Receives booking/gift details from the
// site's booking form and emails Nana via Resend. This exists because
// Resend's API key must stay server-side — it can never be used
// directly from browser JavaScript (see README for details).
//
// CONFIGURE (in Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY   your Resend API key (starts with re_)
//   NOTIFY_TO_EMAIL  where booking notifications should be sent (Nana's inbox)
//   NOTIFY_FROM_EMAIL  the "from" address Resend sends as — must be on a
//                       domain you've verified in Resend. Until a domain
//                       is verified, use "onboarding@resend.dev" for testing.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { RESEND_API_KEY, NOTIFY_TO_EMAIL, NOTIFY_FROM_EMAIL } = process.env;

  if (!RESEND_API_KEY || !NOTIFY_TO_EMAIL || !NOTIFY_FROM_EMAIL) {
    console.error("Missing Resend environment variables.");
    res.status(500).json({ error: "Server not configured. See README." });
    return;
  }

  const payload = req.body || {};

  const rows = Object.entries(payload)
    .map(([key, value]) => `<tr><td style="padding:6px 12px 6px 0;color:#8A8175;font-family:monospace;font-size:12px;text-transform:uppercase;">${escapeHtml(key)}</td><td style="padding:6px 0;">${escapeHtml(String(value))}</td></tr>`)
    .join("");

  const subject = payload.mode === "gift"
    ? `New Aventa gift purchase — ${payload.package || ""}`
    : `New Aventa booking — ${payload.package || ""}`;

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
      <h2 style="font-family:serif;">${escapeHtml(subject)}</h2>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
    </div>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: NOTIFY_FROM_EMAIL,
        to: NOTIFY_TO_EMAIL,
        subject,
        html
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Resend error:", errText);
      res.status(502).json({ error: "Failed to send notification email." });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Notify-booking error:", err);
    res.status(500).json({ error: "Unexpected server error." });
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
