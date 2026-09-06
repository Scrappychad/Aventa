// Shared helper, used by the api/ functions. Files/folders starting with
// "_" are never deployed as their own Vercel Function or public route.
import { head, put } from "@vercel/blob";

// A single small JSON file in Blob storage acts as the source of truth
// mapping each named "slot" on the site (e.g. "home-hero") to whichever
// photo currently fills it. Kept deliberately simple — no database.
export const MANIFEST_PATH = "data/images-manifest.json";

export async function getManifest() {
  try {
    const info = await head(MANIFEST_PATH);
    const response = await fetch(info.url, { cache: "no-store" });
    if (!response.ok) return {};
    return await response.json();
  } catch (err) {
    // Nothing uploaded yet — that's expected on a fresh site.
    return {};
  }
}

export async function saveManifest(manifest) {
  await put(MANIFEST_PATH, JSON.stringify(manifest), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json"
  });
}

export function isValidAdminPassword(password) {
  return Boolean(password) && Boolean(process.env.ADMIN_PASSWORD) && password === process.env.ADMIN_PASSWORD;
}
