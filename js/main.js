/* =========================================================
   AVENTA by NanaGraphy: Site Behavior
   One thing YOU must configure before going live, marked
   clearly below with "CONFIGURE:":
     PAYSTACK_PUBLIC_KEY  - from your Paystack dashboard

   Booking notification emails go through Resend via a Vercel
   serverless function at /api/notify-booking.js — that file
   holds its own setup instructions and needs three environment
   variables set in Vercel before it will send anything.
   ========================================================= */

// CONFIGURE: replace with your live Paystack public key
const PAYSTACK_PUBLIC_KEY = "pk_test_b6bc7b85ee6f1c8e8e3a13259013efd7a293c411";

// Vercel serverless function that emails Nana via Resend. No key lives
// here — the Resend API key stays server-side inside that function.
const NOTIFY_ENDPOINT = "/api/notify-booking";

// Single source of truth for packages, used on Packages and Book pages.
const AVENTA_PACKAGES = [
  {
    id: "basic",
    name: "Basic",
    tag: "A simple lifestyle session",
    price: 20000,
    priceLabel: "₦20,000",
    features: ["Lifestyle photoshoot", "7 professionally edited photos"],
    fine: "Client covers all personal expenses at the location."
  },
  {
    id: "standard",
    name: "Standard",
    tag: "Built for gifting",
    price: 35000,
    priceLabel: "₦35,000",
    features: [
      "Lifestyle photoshoot",
      "7 professionally edited photos",
      "₦10,000 toward your restaurant / location bill"
    ],
    fine: "Our most gifted package.",
    featured: true
  },
  {
    id: "premium",
    name: "Premium",
    tag: "The complete Aventa",
    price: 60000,
    priceLabel: "₦55,000 – ₦60,000",
    features: [
      "Lifestyle photoshoot",
      "7 professionally edited photos",
      "1 cinematic reel",
      "₦20,000 toward your restaurant / location bill"
    ],
    fine: "Final price depends on location and add-ons."
  },
  {
    id: "lifestyle-content",
    name: "Lifestyle Content",
    tag: "For creators & personal brands",
    price: 30000,
    priceLabel: "₦30,000",
    features: ["7 professionally edited photos", "1 short-form reel"],
    fine: "Additional reels available at extra cost."
  },
  {
    id: "brand-content",
    name: "Brand Content",
    tag: "For businesses",
    price: 35000,
    priceLabel: "From ₦35,000",
    features: ["Professional photography", "Video content", "Custom quotation by project scope"],
    fine: "Final quote depends on scope; we'll confirm before booking."
  }
];

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initReveal();
  initFaq();
  initGalleryFilter();
  renderPackageCards();
  initBookingFlow();
  setActiveNav();
});

/* ---------- Nav ---------- */
function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => links.classList.toggle("open"));
}

function setActiveNav() {
  // With cleanUrls, the browser shows paths like "/about", not "about.html".
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (path === "/" && href === "/")) a.classList.add("active");
  });
}

/* ---------- Scroll reveal ---------- */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  items.forEach((i) => io.observe(i));
}

/* ---------- FAQ accordion ---------- */
function initFaq() {
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-q");
    if (!q) return;
    q.addEventListener("click", () => item.classList.toggle("open"));
  });
}

/* ---------- Gallery filter ---------- */
function initGalleryFilter() {
  const chips = document.querySelectorAll(".filter-chip");
  const cards = document.querySelectorAll("[data-category]");
  if (!chips.length) return;
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const cat = chip.dataset.filter;
      cards.forEach((card) => {
        card.style.display = cat === "all" || card.dataset.category === cat ? "" : "none";
      });
    });
  });
}

/* ---------- Package cards (Packages page) ---------- */
function renderPackageCards() {
  const mount = document.querySelector("[data-package-cards]");
  if (!mount) return;
  const filterAttr = mount.dataset.packageCards;
  let list = AVENTA_PACKAGES;
  if (filterAttr) {
    const ids = filterAttr.split(",").map((s) => s.trim());
    list = ids.map((id) => AVENTA_PACKAGES.find((p) => p.id === id)).filter(Boolean);
  }
  mount.innerHTML = list.map(
    (p) => `
    <div class="ticket pkg-card ${p.featured ? "featured" : ""}">
      <div class="pkg-tag">${p.tag}</div>
      <div class="pkg-name">${p.name}</div>
      <div class="price">${p.priceLabel}</div>
      <div class="stub-divider"></div>
      <ul>${p.features.map((f) => `<li>${f}</li>`).join("")}</ul>
      <div class="fine">${p.fine}</div>
      <a class="btn ${p.featured ? "on-ink" : "ghost"} block" href="/book?package=${p.id}">Choose ${p.name}</a>
    </div>`
  ).join("");
}

/* ---------- Booking flow (Book Now page) ---------- */
function initBookingFlow() {
  const root = document.querySelector("[data-booking-flow]");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const state = {
    mode: params.get("mode") === "gift" ? "gift" : "self", // "self" | "gift"
    packageId: params.get("package") || AVENTA_PACKAGES[0].id
  };

  renderModeToggle();
  renderPackageSelect();
  renderSummary();
  wireForm();

  function renderModeToggle() {
    const mount = root.querySelector("[data-mode-toggle]");
    mount.innerHTML = `
      <div class="toggle-opt ${state.mode === "self" ? "active" : ""}" data-mode="self">
        <div class="t-name">Book for myself</div>
        <div class="t-desc">You'll be the one photographed.</div>
      </div>
      <div class="toggle-opt ${state.mode === "gift" ? "active" : ""}" data-mode="gift">
        <div class="t-name">Gift an Aventa</div>
        <div class="t-desc">Someone else redeems it later.</div>
      </div>`;
    mount.querySelectorAll(".toggle-opt").forEach((el) => {
      el.addEventListener("click", () => {
        state.mode = el.dataset.mode;
        renderModeToggle();
        renderPackageSelect();
        renderSummary();
        root.querySelector("[data-gift-fields]").style.display = state.mode === "gift" ? "block" : "none";
      });
    });
    const giftFields = root.querySelector("[data-gift-fields]");
    if (giftFields) giftFields.style.display = state.mode === "gift" ? "block" : "none";
  }

  function renderPackageSelect() {
    const mount = root.querySelector("[data-package-select]");
    mount.innerHTML = AVENTA_PACKAGES.map(
      (p) => `
      <div class="pkg-radio ${p.id === state.packageId ? "active" : ""}" data-pkg="${p.id}">
        <div>
          <div class="r-name">${p.name}</div>
          <div class="pkg-tag" style="margin:2px 0 0;">${p.tag}</div>
        </div>
        <div class="r-price">${p.priceLabel}</div>
      </div>`
    ).join("");
    mount.querySelectorAll(".pkg-radio").forEach((el) => {
      el.addEventListener("click", () => {
        state.packageId = el.dataset.pkg;
        renderPackageSelect();
        renderSummary();
      });
    });
  }

  function currentPackage() {
    return AVENTA_PACKAGES.find((p) => p.id === state.packageId);
  }

  function renderSummary() {
    const mount = root.querySelector("[data-summary]");
    const pkg = currentPackage();
    mount.innerHTML = `
      <div class="summary-row"><span>Package</span><span>${pkg.name}</span></div>
      <div class="summary-row"><span>For</span><span>${state.mode === "gift" ? "A gift recipient" : "Myself"}</span></div>
      <div class="summary-row total"><span>Due today</span><span>${pkg.priceLabel}</span></div>
    `;
    const payBtn = root.querySelector("[data-pay-button]");
    if (payBtn) {
      payBtn.textContent = pkg.price >= 55000 && pkg.id === "premium"
        ? `Pay from ₦${pkg.price.toLocaleString()}`
        : `Pay ${pkg.priceLabel}`;
    }
  }

  function wireForm() {
    const form = root.querySelector("#booking-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const pkg = currentPackage();
      const buyerName = form.buyerName.value.trim();
      const buyerEmail = form.buyerEmail.value.trim();
      const buyerPhone = form.buyerPhone.value.trim();
      const preferredDate = form.preferredDate.value;
      const notes = form.notes.value.trim();

      if (!buyerName || !buyerEmail || !buyerPhone) {
        alert("Please fill in your name, email and phone number.");
        return;
      }

      const bookingDetails = {
        mode: state.mode,
        package: pkg.name,
        amount: pkg.priceLabel,
        buyerName, buyerEmail, buyerPhone, preferredDate, notes
      };

      if (state.mode === "gift") {
        bookingDetails.recipientName = form.recipientName.value.trim();
        bookingDetails.recipientPhone = form.recipientPhone.value.trim();
        bookingDetails.recipientEmail = form.recipientEmail.value.trim();
        bookingDetails.giftMessage = form.giftMessage.value.trim();
        if (!bookingDetails.recipientName) {
          alert("Please add the recipient's name.");
          return;
        }
      }

      startPayment(pkg, bookingDetails, buyerEmail);
    });
  }

  function startPayment(pkg, details, email) {
    if (typeof PaystackPop === "undefined") {
      alert("Payment couldn't load. Please check your connection and try again.");
      return;
    }
    // NOTE: package prices are in Naira above; Paystack expects kobo (x100).
    const amountKobo = pkg.price * 100;
    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: email,
      amount: amountKobo,
      currency: "NGN",
      ref: "AVT-" + Date.now(),
      metadata: {
        custom_fields: [
          { display_name: "Package", variable_name: "package", value: pkg.name },
          { display_name: "Mode", variable_name: "mode", value: details.mode }
        ]
      },
      callback: (response) => {
        finalizeBooking(pkg, details, response.reference);
      },
      onClose: () => {}
    });
    handler.openIframe();
  }

  function generatePassCode() {
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    const rand2 = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `AVT-${rand}-${rand2}`;
  }

  async function finalizeBooking(pkg, details, paystackRef) {
    const passCode = details.mode === "gift" ? generatePassCode() : null;
    notifyNana({ ...details, paystackRef, passCode });
    showConfirmation(pkg, details, passCode, paystackRef);
  }

  async function notifyNana(payload) {
    const showEmailFallback = () => {
      // Fallback: open a pre-filled email so nothing gets lost if the
      // serverless function isn't configured yet, or the request fails.
      const subject = encodeURIComponent(`New Aventa booking: ${payload.package}`);
      const body = encodeURIComponent(
        Object.entries(payload).map(([k, v]) => `${k}: ${v}`).join("\n")
      );
      const link = document.querySelector("[data-notify-fallback]");
      if (link) {
        link.href = `mailto:hello@nanagraphy.com?subject=${subject}&body=${body}`;
        link.style.display = "inline-flex";
      }
    };

    try {
      const response = await fetch(NOTIFY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        console.error("Notify-booking responded with an error.");
        showEmailFallback();
      }
    } catch (err) {
      console.error("Notification failed", err);
      showEmailFallback();
    }
  }

  function showConfirmation(pkg, details, passCode, ref) {
    root.querySelector("[data-booking-form-wrap]").style.display = "none";
    const conf = root.querySelector("[data-confirmation]");
    conf.style.display = "block";
    conf.innerHTML = `
      <div class="ticket confirm-box on-paper">
        <div class="mark">✓</div>
        <span class="status-pill">Payment received</span>
        <h2>${details.mode === "gift" ? "Your Aventa gift is on its way" : "You're booked in"}</h2>
        <p>${
          details.mode === "gift"
            ? `${details.recipientName} will receive their Aventa Pass details from NanaGraphy directly. Keep this reference for your records.`
            : `NanaGraphy has received your booking and will confirm your session date shortly.`
        }</p>
        <div class="stub-divider" style="margin:26px 0 20px;"></div>
        <div class="summary-row"><span>Package</span><span>${pkg.name}</span></div>
        <div class="summary-row"><span>Amount paid</span><span>${pkg.priceLabel}</span></div>
        ${passCode ? `<div class="summary-row"><span>Pass reference</span><span class="pass-code">${passCode}</span></div>` : ""}
        <div class="summary-row"><span>Payment reference</span><span class="pass-code">${ref}</span></div>
        <a data-notify-fallback class="btn ghost" style="display:none;margin-top:24px;" target="_blank">Send booking details by email</a>
      </div>`;
    conf.scrollIntoView({ behavior: "smooth" });
  }
}
