// /api/admin-check
//
// Lets the admin page confirm the password is correct immediately, rather
// than the person only finding out when their first upload fails.

import { isValidAdminPassword } from "./_lib/manifest.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const { password } = req.body || {};
  const ok = isValidAdminPassword(password);
  res.status(ok ? 200 : 401).json({ ok });
}
