// /api/admin-delete
//
// Two modes, matching admin-upload:
//   "slot"    — clears a fixed single photo slot (Home, About).
//   "gallery" — removes one specific photo from a category's list,
//               identified by its exact URL (a category can hold
//               several photos, so we need to know which one).

import { del } from "@vercel/blob";
import { getManifest, saveManifest, isValidAdminPassword } from "./_lib/manifest.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { password, mode, slot, category, url } = req.body || {};

  if (!isValidAdminPassword(password)) {
    res.status(401).json({ error: "Wrong password." });
    return;
  }

  try {
    const manifest = await getManifest();

    if (mode === "gallery") {
      if (!category || !url) {
        res.status(400).json({ error: "Missing category or url." });
        return;
      }
      try {
        await del(url);
      } catch (err) {
        console.error("Blob delete failed (continuing):", err);
      }
      manifest.gallery = manifest.gallery || {};
      manifest.gallery[category] = (manifest.gallery[category] || []).filter((u) => u !== url);
      await saveManifest(manifest);
      res.status(200).json({ ok: true, gallery: manifest.gallery });
    } else {
      if (!slot) {
        res.status(400).json({ error: "Missing slot." });
        return;
      }
      const existingUrl = manifest[slot];
      if (existingUrl) {
        try {
          await del(existingUrl);
        } catch (err) {
          console.error("Blob delete failed (continuing):", err);
        }
      }
      delete manifest[slot];
      await saveManifest(manifest);
      res.status(200).json({ ok: true, manifest });
    }
  } catch (err) {
    console.error("admin-delete error:", err);
    res.status(500).json({ error: "Could not remove that image. Try again." });
  }
}
