// /api/admin-upload
//
// Receives an already resized/compressed photo as base64 JSON and uploads
// it to Vercel Blob from the server. We route through our own function
// instead of the SDK's documented browser-direct-upload pattern because
// that pattern currently hits a confirmed, unresolved CORS bug on
// Vercel's own platform (vercel.com/api/blob doesn't return CORS headers
// for some projects — see Vercel's own community forum for other
// developers hitting the identical error). The browser compresses every
// photo before sending it here, so this comfortably stays under Vercel
// Functions' 4.5MB request body limit despite going the "simple" route.

import { put } from "@vercel/blob";
import { getManifest, saveManifest, isValidAdminPassword } from "./_lib/manifest.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { password, slot, contentType, dataBase64 } = req.body || {};

  if (!isValidAdminPassword(password)) {
    res.status(401).json({ error: "Wrong password." });
    return;
  }
  if (!slot || !dataBase64) {
    res.status(400).json({ error: "Missing slot or image data." });
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
    const blob = await put(`images/${slot}`, buffer, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: contentType || "image/jpeg"
    });

    const manifest = await getManifest();
    // Cache-bust — the file gets overwritten in place at the same path,
    // and without this, browsers/CDNs can keep serving the old cached
    // photo after a replace.
    manifest[slot] = `${blob.url}?v=${Date.now()}`;
    await saveManifest(manifest);

    res.status(200).json({ ok: true, url: manifest[slot] });
  } catch (err) {
    console.error("admin-upload error:", err);
    res.status(500).json({ error: "Upload failed. Try again." });
  }
}