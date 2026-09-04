// Admin page for uploading/replacing site photos.
//
// Uses Vercel Blob's browser-direct upload: the file goes straight from
// this page to Blob storage, never through our own server function (which
// has a hard 4.5MB request limit — too small for real phone photos).
// /api/admin-upload-token authorizes each upload and checks the password.
import { upload } from "https://esm.sh/@vercel/blob@2.8.0/client";

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

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB, matches the server-side cap
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
      errorEl.textContent = "Wrong password.";
      errorEl.style.display = "block";
      sessionStorage.removeItem("aventa-admin-password");
      return;
    }
    adminPassword = password;
    sessionStorage.setItem("aventa-admin-password", password);
    document.getElementById("password-gate").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
    await loadManifestAndRender();
  } catch (err) {
    errorEl.textContent = "Couldn't reach the server. Check your connection.";
    errorEl.style.display = "block";
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
      <div class="admin-slot-actions">
        <button type="button" class="btn ghost" data-upload-btn>Upload</button>
        <button type="button" class="btn ghost" data-remove-btn ${currentUrl ? "" : "disabled"}>Remove</button>
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
      setStatus("That file's too big — keep it under 10MB.", "err");
      return;
    }

    setStatus("Uploading…");
    uploadBtn.disabled = true;
    try {
      const result = await upload(`images/${slotId}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin-upload-token",
        clientPayload: JSON.stringify({ password: adminPassword, slot: slotId })
      });
      manifest[slotId] = result.url;
      thumbEl.innerHTML = `<img src="${result.url}" alt="">`;
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

  removeBtn.addEventListener("click", async () => {
    if (!confirm("Remove this photo? The site will show the placeholder until you upload a new one.")) return;
    setStatus("Removing…");
    removeBtn.disabled = true;
    try {
      const res = await fetch("/api/admin-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword, slot: slotId })
      });
      if (!res.ok) throw new Error("Delete failed.");
      delete manifest[slotId];
      thumbEl.innerHTML = "No photo yet";
      setStatus("Removed.", "ok");
    } catch (err) {
      setStatus("Couldn't remove it. Try again.", "err");
      removeBtn.disabled = false;
    }
  });
}
