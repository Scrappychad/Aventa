// /api/admin-upload
//
// Receives an already resized/compressed photo as base64 JSON and uploads
// it to Vercel Blob from the server. We route through our own function
// instead of the SDK's documented browser-direct-upload pattern because
// that pattern currently hits a confirmed, unresolved CORS bug on
// Vercel's own platform. The browser compresses every photo before
// sending it here, so this comfortably stays under Vercel Functions'
// 4.5MB request body limit despite going the "simple" route.
//
// Two upload modes:
//   "slot"    — a fixed single photo (Home, About). Always overwrites
//               the same path, so there's only ever one image per slot.
//   "gallery" — appends a new photo to a category's list (Lifestyle,
//               Birthday, etc.). Each upload gets its own unique path,
//               so a category can grow to any number of photos.

import { put } from "@vercel/blob";
import { getManifest, saveManifest, isValidAdminPassword } from "./_lib/manifest.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { password, mode, slot, category, contentType, dataBase64 } = req.body || {};

  if (!isValidAdminPassword(password)) {
    res.status(401).json({ error: "Wrong password." });
    return;
  }
  if (!dataBase64) {
    res.status(400).json({ error: "Missing image data." });
    return;
  }
  if (mode === "slot" && !slot) {
    res.status(400).json({ error: "Missing slot." });
    return;
  }
  if (mode === "gallery" && !category) {
    res.status(400).json({ error: "Missing category." });
    return;
  }

  let buffer;
  try {
    buffer = Buffer.from(dataBase64, "base64");
  } catch (err) {
    res.status(400).json({ error: "Image data was corrupted in transit. Try again." });
    return;
  }

  if (buffer.length > 8 * 1024 * 1024) {
    res.status(400).json({ error: "Image is still too large after compression. Try a different photo." });
    return;
  }

  try {
    const manifest = await getManifest();

    if (mode === "gallery") {
      // Each gallery photo gets its own unique path — addRandomSuffix
      // handles that automatically, since a category can hold any
      // number of photos rather than replacing a single fixed one.
      const blob = await put(`images/gallery-${category}`, buffer, {
        access: "public",
        addRandomSuffix: true,
        contentType: contentType || "image/jpeg"
      });
      manifest.gallery = manifest.gallery || {};
      manifest.gallery[category] = manifest.gallery[category] || [];
      manifest.gallery[category].push(blob.url);
      await saveManifest(manifest);
      res.status(200).json({ ok: true, url: blob.url, gallery: manifest.gallery });
    } else {
      const blob = await put(`images/${slot}`, buffer, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: contentType || "image/jpeg"
      });
      // Cache-bust — the file gets overwritten in place at the same
      // path, and without this, browsers/CDNs can keep serving the old
      // cached photo after a replace.
      manifest[slot] = `${blob.url}?v=${Date.now()}`;
      await saveManifest(manifest);
      res.status(200).json({ ok: true, url: manifest[slot] });
    }
  } catch (err) {
    console.error("admin-upload error:", err);
    res.status(500).json({ error: "Upload failed. Try again." });
  }
}
