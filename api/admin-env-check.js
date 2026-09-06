// /api/admin-env-check
//
// Called right after a successful password unlock. Catches a missing
// BLOB_READ_WRITE_TOKEN immediately, with a clear message — instead of
// the person only finding out when their first photo upload fails with
// a generic error buried in the browser's Network tab.

import { isValidAdminPassword } from "./_lib/manifest.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const { password } = req.body || {};
  if (!isValidAdminPassword(password)) {
    res.status(401).json({ error: "Wrong password." });
    return;
  }
  res.status(200).json({
    blobTokenPresent: Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  });
}
