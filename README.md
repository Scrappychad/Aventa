# Aventa by NanaGraphy: Website

Mostly a static site (plain HTML + one shared CSS file + one shared JS
file) plus a small set of Vercel serverless functions: one for booking
emails, and a few for the admin photo-upload page. You can open
`index.html` directly in a browser to preview the pages right now — the
booking emails and admin uploads need the site actually deployed on
Vercel, since those run server-side.

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

### 3. Set up the admin photo page
Every image on the site is a placeholder tinted block until a real photo
is uploaded through `/admin` — a password-protected page for uploading or
replacing any photo on the site, live, with no code changes or redeploys.

**One-time setup:**
1. In your Vercel project: **Storage → Create Database → Blob**. This
   creates the storage bucket that holds uploaded photos and automatically
   adds a `BLOB_READ_WRITE_TOKEN` environment variable — you don't need to
   copy anything yourself.
2. In **Settings → Environment Variables**, add one more:
   - `ADMIN_PASSWORD` — whatever password you want to gate `/admin` with.
     Keep it different from anything else you use.
3. Redeploy.

**Using it:** go to `yourdomain.com/admin`, enter the password, and you'll
see every photo slot on the site (Home, About, Gallery) with an upload
button. JPEG/PNG/WebP, up to 10MB per photo — worth compressing phone
photos down a bit anyway, for page-load speed. Uploading replaces that
slot's placeholder immediately across the live site; no waiting, no
redeploy.

The `/admin` page isn't linked from anywhere on the public site, and it's
excluded from search engines — but the real protection is the password
check itself, not the page being hard to find. Don't share the password
outside the two of you.

## Update real contact details
`contact.html`, and the footer on every page, currently link to placeholder
WhatsApp/Instagram/TikTok/email. Search each HTML file for
`2340000000000`, `nanagraphy` (social handles), and `hello@nanagraphy.com`
and replace with the real ones.

## Deploy to Vercel (same flow as your other projects)
1. Push this folder to a new GitHub repo.
2. In Vercel: **New Project → Import** that repo.
3. Framework preset: **Other**. Vercel will run `npm install` (needed for
   the admin page's Blob dependency) and auto-detect the `api/` folder as
   serverless functions — no build command needed beyond that.
4. Add the Resend and `ADMIN_PASSWORD` environment variables (see above)
   before or right after your first deploy, and create the Blob store.
5. Deploy. Vercel will serve `index.html` at your domain automatically.

**One thing worth double-checking separately:** Vercel's free Hobby plan
terms restrict it to non-commercial projects. Aventa processes real
payments, so confirm you're on a Pro plan (or otherwise cleared for
commercial use) before this goes fully live — unrelated to anything above,
just worth knowing.

## What's intentionally NOT built yet (and why)
- **No live booking calendar.** The date field is a simple date picker;
  Nana confirms availability manually. A real-time calendar needs a
  backend — not worth building until booking volume actually needs it.
- **No automated redemption ledger for gift passes.** Each gift generates
  a pass reference code (e.g. `AVT-4F2C-1KX9`) shown on the confirmation
  screen and emailed to Nana. Tracking which passes have been redeemed is
  manual for now (a spreadsheet). Automate this once Aventa has enough
  gift volume to justify a database.

Both of the above are one-day builds later, once the numbers justify them —
flag it back to me when you're there.
