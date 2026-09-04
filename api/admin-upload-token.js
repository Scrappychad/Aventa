// /api/admin-upload-token
//
// This does NOT receive the photo itself — the browser uploads the file
// bytes directly to Vercel Blob, bypassing this function entirely, because
// Vercel Functions hard-cap request bodies at 4.5MB and real phone photos
// blow past that easily. This endpoint is called twice by the Blob SDK:
//   1. Before the upload starts, to authorize it (we check the password
//      here — this is the only real gatekeeping in the whole flow).
//   2. After the upload finishes, to tell us the photo's final URL so we
//      can save it into the manifest.

import { handleUpload } from "@vercel/blob/client";
import { getManifest, saveManifest, isValidAdminPassword } from "./_lib/manifest.js";

export default async function handler(req, res) {
  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = clientPayload ? JSON.parse(clientPayload) : {};
        if (!isValidAdminPassword(payload.password)) {
          throw new Error("Wrong password.");
        }
        if (!payload.slot) {
          throw new Error("Missing slot.");
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          addRandomSuffix: false,
          allowOverwrite: true,
          maximumSizeInBytes: 10 * 1024 * 1024 // 10MB per photo
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = tokenPayload ? JSON.parse(tokenPayload) : {};
        if (!payload.slot) return;
        const manifest = await getManifest();
        manifest[payload.slot] = blob.url;
        await saveManifest(manifest);
      }
    });
    res.status(200).json(jsonResponse);
  } catch (err) {
    console.error("admin-upload-token error:", err);
    res.status(400).json({ error: (err && err.message) || "Upload could not be authorized." });
  }
}
