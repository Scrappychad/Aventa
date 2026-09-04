// /api/admin-delete
//
// Removes a slot's photo — the site falls back to its placeholder for
// that spot until a new photo is uploaded. Also deletes the underlying
// Blob file so storage doesn't quietly accumulate orphaned images.

import { del } from "@vercel/blob";
import { getManifest, saveManifest, isValidAdminPassword } from "./_lib/manifest.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { password, slot } = req.body || {};

  if (!isValidAdminPassword(password)) {
    res.status(401).json({ error: "Wrong password." });
    return;
  }
  if (!slot) {
    res.status(400).json({ error: "Missing slot." });
    return;
  }

  try {
    const manifest = await getManifest();
    const existingUrl = manifest[slot];

    if (existingUrl) {
      try {
        await del(existingUrl);
      } catch (err) {
        // Not fatal — the manifest entry is what actually controls what
        // the site displays, so still proceed to clear it either way.
        console.error("Blob delete failed (continuing):", err);
      }
    }

    delete manifest[slot];
    await saveManifest(manifest);
    res.status(200).json({ ok: true, manifest });
  } catch (err) {
    console.error("admin-delete error:", err);
    res.status(500).json({ error: "Could not remove that image. Try again." });
  }
}
