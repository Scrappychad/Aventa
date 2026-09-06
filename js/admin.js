// Admin page for uploading/replacing site photos.
//
// Photos are compressed in the browser (resized + re-encoded as JPEG)
// before being sent to our own server, which then stores them in Vercel
// Blob. We don't use Vercel Blob's documented browser-direct-upload
// pattern here — it currently hits a confirmed, unresolved CORS bug on
// Vercel's platform. Compressing client-side first means this simpler
// approach never gets close to Vercel Functions' 4.5MB request limit.

// Every image slot on the live site, grouped the way the pages are.
const SLOT_GROUPS = [
  {
    title: "Home page",
    slots: [
      { id: "home-hero", label: "Hero pass photo" },
      { id: "home-preview-lifestyle", label: "Preview — Lifestyle" },
      { id: "home-preview-birthday", label: "Preview — Birthday" },
      { id: "home-preview-couples", label: "Preview — Couples" },
      { id: "home-preview-graduation", label: "Preview — Graduation" }
    ]
  },
  {
    title: "About page",
    slots: [{ id: "about-portrait", label: "Nana's portrait" }]
  },
  {
    title: "Gallery page",
    slots: [
      { id: "gallery-lifestyle-1", label: "Lifestyle 1" },
      { id: "gallery-birthday-1", label: "Birthday 1" },
      { id: "gallery-couples-1", label: "Couples 1" },
      { id: "gallery-graduation-1", label: "Graduation 1" },
      { id: "gallery-lifestyle-2", label: "Lifestyle 2" },
      { id: "gallery-brand-1", label: "Brand 1" },
      { id: "gallery-reels-1", label: "Reel still 1" },
      { id: "gallery-birthday-2", label: "Birthday 2" },
      { id: "gallery-couples-2", label: "Couples 2" },
      { id: "gallery-graduation-2", label: "Graduation 2" },
      { id: "gallery-brand-2", label: "Brand 2" },
      { id: "gallery-reels-2", label: "Reel still 2" }
    ]
  }
];

const MAX_FILE_BYTES = 20 * 1024 * 1024; // generous — real cap is enforced after compression, below
const MAX_DIMENSION = 2000; // px, longer side — plenty for web display, keeps files small
const JPEG_QUALITY = 0.82;

// Resizes and re-encodes a photo in the browser before it's ever sent
// anywhere. A modern phone photo can be 8-15MB; this reliably brings it
// down to a few hundred KB to a couple MB, which is what makes routing
// the upload through our own server (see comment above) practical.
async function compressImage(file) {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed."))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

let adminPassword = "";
let manifest = {};

document.addEventListener("DOMContentLoaded", () => {
  const savedPassword = sessionStorage.getItem("aventa-admin-password");
  if (savedPassword) {
    tryUnlock(savedPassword);
  }
  document.getElementById("unlock-btn").addEventListener("click", () => {
    const value = document.getElementById("admin-password-input").value;
    tryUnlock(value);
  });
  document.getElementById("admin-password-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("unlock-btn").click();
  });
});

async function tryUnlock(password) {
  const errorEl = document.getElementById("password-error");
  errorEl.style.display = "none";
  if (!password) return;

  try {
    const res = await fetch("/api/admin-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (!res.ok) {
      if (res.status === 401) {
        errorEl.textContent = "Wrong password.";
      } else {
        errorEl.textContent = `Server error (status ${res.status}) — this isn't a wrong password, something else is failing. Check Vercel's function logs for admin-check.`;
      }
      errorEl.style.display = "block";
      sessionStorage.removeItem("aventa-admin-password");
      return;
    }
    adminPassword = password;
    sessionStorage.setItem("aventa-admin-password", password);
    document.getElementById("password-gate").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
    await checkServerSetup();
    await loadManifestAndRender();
  } catch (err) {
    errorEl.textContent = "Couldn't reach the server. Check your connection.";
    errorEl.style.display = "block";
  }
}

async function checkServerSetup() {
  const panel = document.getElementById("admin-panel");
  try {
    const res = await fetch("/api/admin-env-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: adminPassword })
    });
    const data = await res.json();
    if (res.ok && !data.blobTokenPresent) {
      const warning = document.createElement("div");
      warning.className = "ticket form-panel";
      warning.style.cssText = "margin-bottom:24px; border-color:var(--error);";
      warning.innerHTML = `
        <h3 style="color:var(--error); margin-bottom:8px;">⚠ Photo storage isn't connected</h3>
        <p style="margin:0;">BLOB_READ_WRITE_TOKEN isn't set on the server. Uploads will fail until this is fixed — see the "Set up the admin photo page" section in the README. Most common cause: the Blob store was created from outside this specific project, or a deploy happened before it was connected.</p>`;
      panel.prepend(warning);
    }
  } catch (err) {
    // Don't block the page over a diagnostic check failing.
  }
}

async function loadManifestAndRender() {
  try {
    const res = await fetch("/api/images", { cache: "no-store" });
    manifest = await res.json();
  } catch (err) {
    manifest = {};
  }
  renderPanel();
}

function renderPanel() {
  const panel = document.getElementById("admin-panel");
  panel.innerHTML = SLOT_GROUPS.map(
    (group) => `
    <div class="admin-group">
      <h3>${group.title}</h3>
      <div class="admin-slot-grid">
        ${group.slots.map((slot) => renderSlotCard(slot)).join("")}
      </div>
    </div>`
  ).join("");

  SLOT_GROUPS.flatMap((g) => g.slots).forEach((slot) => wireSlotCard(slot.id));
}

function renderSlotCard(slot) {
  const currentUrl = manifest[slot.id];
  return `
    <div class="admin-slot" data-slot-card="${slot.id}">
      <div class="admin-thumb" data-thumb>
        ${currentUrl ? `<img src="${currentUrl}" alt="${slot.label}">` : "No photo yet"}
      </div>
      <div class="admin-slot-label">${slot.label}</div>
      <input type="file" accept="image/jpeg,image/png,image/webp" data-file-input>
      <div class="admin-slot-actions" data-actions-row>
        <button type="button" class="btn ghost" data-upload-btn>Upload</button>
        <button type="button" class="btn ghost" data-remove-btn ${currentUrl ? "" : "disabled"}>Remove</button>
      </div>
      <div class="admin-slot-actions admin-remove-confirm" data-remove-confirm style="display:none;">
        <span class="admin-remove-confirm-text">Remove this photo?</span>
        <button type="button" class="btn ghost" data-cancel-remove>Cancel</button>
        <button type="button" class="btn danger" data-confirm-remove>Yes, remove</button>
      </div>
      <div class="admin-slot-status" data-status></div>
    </div>`;
}

function wireSlotCard(slotId) {
  const card = document.querySelector(`[data-slot-card="${slotId}"]`);
  if (!card) return;

  const fileInput = card.querySelector("[data-file-input]");
  const uploadBtn = card.querySelector("[data-upload-btn]");
  const removeBtn = card.querySelector("[data-remove-btn]");
  const statusEl = card.querySelector("[data-status]");
  const thumbEl = card.querySelector("[data-thumb]");

  const setStatus = (text, kind) => {
    statusEl.textContent = text;
    statusEl.className = "admin-slot-status" + (kind ? ` ${kind}` : "");
  };

  uploadBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
      setStatus("Choose a photo first.", "err");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setStatus("Use a JPEG, PNG, or WebP file.", "err");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setStatus("That file's too big — keep it under 20MB.", "err");
      return;
    }

    uploadBtn.disabled = true;
    try {
      setStatus("Preparing photo…");
      const compressed = await compressImage(file);
      const dataBase64 = await blobToBase64(compressed);

      setStatus("Uploading…");
      const res = await fetch("/api/admin-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: adminPassword,
          slot: slotId,
          contentType: "image/jpeg",
          dataBase64
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");

      manifest[slotId] = data.url;
      thumbEl.innerHTML = `<img src="${data.url}" alt="">`;
      removeBtn.disabled = false;
      fileInput.value = "";
      setStatus("Uploaded — live on the site now.", "ok");
    } catch (err) {
      console.error(err);
      setStatus(err.message === "Wrong password." ? "Session expired — reload and re-enter the password." : "Upload failed. Try again.", "err");
    } finally {
      uploadBtn.disabled = false;
    }
  });

  const actionsRow = card.querySelector("[data-actions-row]");
  const confirmRow = card.querySelector("[data-remove-confirm]");
  const cancelBtn = card.querySelector("[data-cancel-remove]");
  const confirmRemoveBtn = card.querySelector("[data-confirm-remove]");

  removeBtn.addEventListener("click", () => {
    actionsRow.style.display = "none";
    confirmRow.style.display = "flex";
  });

  cancelBtn.addEventListener("click", () => {
    confirmRow.style.display = "none";
    actionsRow.style.display = "flex";
  });

  confirmRemoveBtn.addEventListener("click", async () => {
    setStatus("Removing…");
    confirmRemoveBtn.disabled = true;
    cancelBtn.disabled = true;
    try {
      const res = await fetch("/api/admin-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword, slot: slotId })
      });
      if (!res.ok) throw new Error("Delete failed.");
      delete manifest[slotId];
      thumbEl.innerHTML = "No photo yet";
      removeBtn.disabled = true;
      setStatus("Removed.", "ok");
    } catch (err) {
      setStatus("Couldn't remove it. Try again.", "err");
    } finally {
      confirmRemoveBtn.disabled = false;
      cancelBtn.disabled = false;
      confirmRow.style.display = "none";
      actionsRow.style.display = "flex";
    }
  });
}
