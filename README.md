# Aventa by NanaGraphy: Website

Mostly a static site (plain HTML + one shared CSS file + one shared JS
file) plus one small serverless function for sending emails. You can open
`index.html` directly in a browser to preview the pages right now — only
the booking-notification email needs the site actually deployed on Vercel
to work, since that part runs server-side.

## Before this goes live, do these things

### 1. Add your Paystack key
Open `js/main.js`, near the top:
```js
const PAYSTACK_PUBLIC_KEY = "pk_test_REPLACE_WITH_YOUR_PAYSTACK_PUBLIC_KEY";
```
Replace it with Nana's real **public** key from the Paystack dashboard
(Settings → API Keys & Webhooks). Use the `pk_test_...` key while testing,
switch to the `pk_live_...` key when you're ready to take real payments.

### 2. Connect booking notifications (via Resend)
Every completed booking or gift purchase should email Nana automatically
with the buyer's details, the package, and (for gifts) the recipient's
details and message. That email is sent by Resend, through a small
serverless function at `api/notify-booking.js` — Resend's API key can
never be used directly from browser JavaScript, so it needs a small
server-side step in between. Set this up once:

1. Create a free account at [resend.com](https://resend.com) and grab an
   API key from the dashboard (starts with `re_`).
2. For real deliverability, verify a domain in Resend (e.g.
   `nanagraphy.com`) and set up the DNS records they give you. While
   testing, you can skip this and send from `onboarding@resend.dev`
   instead — it works immediately but only delivers to the email address
   on the Resend account itself, so it's for testing only.
3. In your Vercel project: **Settings → Environment Variables**, add:
   - `RESEND_API_KEY` — the key from step 1
   - `NOTIFY_TO_EMAIL` — the inbox that should receive booking alerts (Nana's email)
   - `NOTIFY_FROM_EMAIL` — the "from" address (e.g. `bookings@nanagraphy.com`
     once your domain is verified, or `onboarding@resend.dev` for testing)
4. Redeploy. No code changes needed — the function reads those three
   values automatically.

If the function isn't configured yet, or a request fails for any reason,
the site falls back to opening a pre-filled email in the customer's own
email app, so nothing gets silently lost while you're setting this up.

## Add real photos
Every image on the site is a placeholder `<div class="frame">` (tinted
gradient blocks) so the layout works without real photos yet. To swap one in,
replace:
```html
<div class="frame r-3-4" data-caption="Lifestyle"></div>
```
with:
```html
<img class="frame r-3-4" src="images/your-photo.jpg" alt="Lifestyle session">
```
Keep the class (`r-3-4`, `r-4-5`, `r-1-1`, or `r-16-9`) so the crop ratio
stays consistent. Put your photo files in an `images/` folder next to
`index.html`.

## Update real contact details
`contact.html`, and the footer on every page, currently link to placeholder
WhatsApp/Instagram/TikTok/email. Search each HTML file for
`2340000000000`, `nanagraphy` (social handles), and `hello@nanagraphy.com`
and replace with the real ones.

## Deploy to Vercel (same flow as your other projects)
1. Push this folder to a new GitHub repo.
2. In Vercel: **New Project → Import** that repo.
3. Framework preset: **Other** — Vercel auto-detects the `api/` folder and
   deploys `notify-booking.js` as a serverless function; no build command
   needed for the rest of the site.
4. Add the three Resend environment variables (see above) before or right
   after your first deploy.
5. Deploy. Vercel will serve `index.html` at your domain automatically.

## What's intentionally NOT built yet (and why)
- **No live booking calendar.** The date field is a simple date picker;
  Nana confirms availability manually. A real-time calendar needs a backend
  It's not worth building until booking volume actually needs it.
- **No automated redemption ledger for gift passes.** Each gift generates a
  pass reference code (e.g. `AVT-4F2C-1KX9`) shown on the confirmation
  screen and emailed to Nana. Tracking which passes have been redeemed is
  manual for now (a spreadsheet). Automate this once Aventa has enough
  gift volume to justify a database.

Both of the above are one-day builds later, once the numbers justify them,
flag it back to me when you're there.


## What's intentionally NOT built yet (and why)
- **No live booking calendar.** The date field is a simple date picker;
  Nana confirms availability manually. A real-time calendar needs a backend
  It's not worth building until booking volume actually needs it.
- **No automated redemption ledger for gift passes.** Each gift generates a
  pass reference code (e.g. `AVT-4F2C-1KX9`) shown on the confirmation
  screen and emailed to Nana. Tracking which passes have been redeemed is
  manual for now (a spreadsheet). Automate this once Aventa has enough
  gift volume to justify a database.

Both of the above are one-day builds later, once the numbers justify them,
flag it back to me when you're there.
