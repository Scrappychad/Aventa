// /api/images
//
// Public, read-only. Every page fetches this on load to find out which
// "slots" (home-hero, gallery-lifestyle-1, etc.) have a real uploaded
// photo, and swaps it in over the placeholder. No password needed here —
// these are the same images visitors already see on the live site.

import { getManifest } from "./_lib/manifest.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const manifest = await getManifest();
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.status(200).json(manifest);
}
