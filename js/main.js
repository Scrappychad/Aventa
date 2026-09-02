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
const PAYSTACK_PUBLIC_KEY = "pk_test_45e128abb6c08ce3c7afba44f0a6c538b41c2a45";

// Vercel serverless function that emails Nana via Resend. No key lives
// here — the Resend API key stays server-side inside that function.
const NOTIFY_ENDPOINT = "/api/notify-booking";

// ITU-T country calling codes. Value stored is digits only, no "+".
// Nigeria first since that's the home market; rest alphabetical by name.
const COUNTRY_CODES = [
  ["NG", "Nigeria", "234"],
  ["GH", "Ghana", "233"],
  ["KE", "Kenya", "254"],
  ["ZA", "South Africa", "27"],
  ["US", "United States", "1"],
  ["CA", "Canada", "1"],
  ["GB", "United Kingdom", "44"],
  ["AE", "United Arab Emirates", "971"],
  ["AF", "Afghanistan", "93"], ["AL", "Albania", "355"], ["DZ", "Algeria", "213"],
  ["AR", "Argentina", "54"], ["AM", "Armenia", "374"], ["AU", "Australia", "61"],
  ["AT", "Austria", "43"], ["AZ", "Azerbaijan", "994"], ["BH", "Bahrain", "973"],
  ["BD", "Bangladesh", "880"], ["BY", "Belarus", "375"], ["BE", "Belgium", "32"],
  ["BJ", "Benin", "229"], ["BO", "Bolivia", "591"], ["BA", "Bosnia and Herzegovina", "387"],
  ["BW", "Botswana", "267"], ["BR", "Brazil", "55"], ["BG", "Bulgaria", "359"],
  ["BF", "Burkina Faso", "226"], ["BI", "Burundi", "257"], ["KH", "Cambodia", "855"],
  ["CM", "Cameroon", "237"], ["CV", "Cape Verde", "238"], ["CF", "Central African Republic", "236"],
  ["TD", "Chad", "235"], ["CL", "Chile", "56"], ["CN", "China", "86"],
  ["CO", "Colombia", "57"], ["CG", "Congo", "242"], ["CD", "Congo (DRC)", "243"],
  ["CR", "Costa Rica", "506"], ["CI", "Côte d'Ivoire", "225"], ["HR", "Croatia", "385"],
  ["CU", "Cuba", "53"], ["CY", "Cyprus", "357"], ["CZ", "Czech Republic", "420"],
  ["DK", "Denmark", "45"], ["DJ", "Djibouti", "253"], ["DO", "Dominican Republic", "1"],
  ["EC", "Ecuador", "593"], ["EG", "Egypt", "20"], ["SV", "El Salvador", "503"],
  ["EE", "Estonia", "372"], ["ET", "Ethiopia", "251"], ["FJ", "Fiji", "679"],
  ["FI", "Finland", "358"], ["FR", "France", "33"], ["GA", "Gabon", "241"],
  ["GM", "Gambia", "220"], ["GE", "Georgia", "995"], ["DE", "Germany", "49"],
  ["GR", "Greece", "30"], ["GT", "Guatemala", "502"], ["GN", "Guinea", "224"],
  ["GY", "Guyana", "592"], ["HT", "Haiti", "509"], ["HN", "Honduras", "504"],
  ["HK", "Hong Kong", "852"], ["HU", "Hungary", "36"], ["IS", "Iceland", "354"],
  ["IN", "India", "91"], ["ID", "Indonesia", "62"], ["IR", "Iran", "98"],
  ["IQ", "Iraq", "964"], ["IE", "Ireland", "353"], ["IL", "Israel", "972"],
  ["IT", "Italy", "39"], ["JM", "Jamaica", "1"], ["JP", "Japan", "81"],
  ["JO", "Jordan", "962"], ["KZ", "Kazakhstan", "7"], ["KW", "Kuwait", "965"],
  ["LA", "Laos", "856"], ["LV", "Latvia", "371"], ["LB", "Lebanon", "961"],
  ["LS", "Lesotho", "266"], ["LR", "Liberia", "231"], ["LY", "Libya", "218"],
  ["LT", "Lithuania", "370"], ["LU", "Luxembourg", "352"], ["MG", "Madagascar", "261"],
  ["MW", "Malawi", "265"], ["MY", "Malaysia", "60"], ["ML", "Mali", "223"],
  ["MT", "Malta", "356"], ["MR", "Mauritania", "222"], ["MU", "Mauritius", "230"],
  ["MX", "Mexico", "52"], ["MD", "Moldova", "373"], ["MC", "Monaco", "377"],
  ["MN", "Mongolia", "976"], ["ME", "Montenegro", "382"], ["MA", "Morocco", "212"],
  ["MZ", "Mozambique", "258"], ["MM", "Myanmar", "95"], ["NA", "Namibia", "264"],
  ["NP", "Nepal", "977"], ["NL", "Netherlands", "31"], ["NZ", "New Zealand", "64"],
  ["NI", "Nicaragua", "505"], ["NE", "Niger", "227"], ["NO", "Norway", "47"],
  ["OM", "Oman", "968"], ["PK", "Pakistan", "92"], ["PA", "Panama", "507"],
  ["PY", "Paraguay", "595"], ["PE", "Peru", "51"], ["PH", "Philippines", "63"],
  ["PL", "Poland", "48"], ["PT", "Portugal", "351"], ["QA", "Qatar", "974"],
  ["RO", "Romania", "40"], ["RU", "Russia", "7"], ["RW", "Rwanda", "250"],
  ["SA", "Saudi Arabia", "966"], ["SN", "Senegal", "221"], ["RS", "Serbia", "381"],
  ["SC", "Seychelles", "248"], ["SL", "Sierra Leone", "232"], ["SG", "Singapore", "65"],
  ["SK", "Slovakia", "421"], ["SI", "Slovenia", "386"], ["SO", "Somalia", "252"],
  ["KR", "South Korea", "82"], ["SS", "South Sudan", "211"], ["ES", "Spain", "34"],
  ["LK", "Sri Lanka", "94"], ["SD", "Sudan", "249"], ["SR", "Suriname", "597"],
  ["SE", "Sweden", "46"], ["CH", "Switzerland", "41"], ["SY", "Syria", "963"],
  ["TW", "Taiwan", "886"], ["TZ", "Tanzania", "255"], ["TH", "Thailand", "66"],
  ["TG", "Togo", "228"], ["TT", "Trinidad and Tobago", "1"], ["TN", "Tunisia", "216"],
  ["TR", "Turkey", "90"], ["UG", "Uganda", "256"], ["UA", "Ukraine", "380"],
  ["UY", "Uruguay", "598"], ["UZ", "Uzbekistan", "998"], ["VE", "Venezuela", "58"],
  ["VN", "Vietnam", "84"], ["YE", "Yemen", "967"], ["ZM", "Zambia", "260"],
  ["ZW", "Zimbabwe", "263"]
];

// E.164 hard cap: max 15 digits total (country code + national number).
const E164_MAX_DIGITS = 15;

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

  // Safety net: if IntersectionObserver isn't available, or if the
  // browser never fires it for any reason, don't leave content stuck
  // invisible — this matters on slower mobile connections where a
  // reveal-in animation is a nice-to-have, but hidden content is not.
  const forceVisible = () => items.forEach((i) => i.classList.add("in"));

  if (typeof IntersectionObserver === "undefined") {
    forceVisible();
    return;
  }

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

  // Belt-and-suspenders: if something above ever fails silently,
  // reveal everything after 2s no matter what.
  setTimeout(forceVisible, 2000);
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
  initPhoneFields();
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

  // A real name needs at least one letter — blocks "12345", "!!!", etc.
  // Allows accented letters, hyphens, apostrophes, spaces (Mary-Jane, O'Neil).
  function looksLikeAName(value) {
    return /[a-zA-Z\u00C0-\u024F]/.test(value);
  }

  // Populates both country-code dropdowns and enforces the E.164 15-digit
  // cap (country code + national number, digits only) as the person types.
  function initPhoneFields() {
    const codeSelects = root.querySelectorAll("[data-phone-code]");
    codeSelects.forEach((select) => {
      select.innerHTML = COUNTRY_CODES.map(
        ([iso, name, dial]) => `<option value="${dial}">${name} (+${dial})</option>`
      ).join("");
    });

    const phoneFields = root.querySelectorAll(".phone-field");
    phoneFields.forEach((field) => {
      const codeSelect = field.querySelector("[data-phone-code]");
      const numberInput = field.querySelector("[data-phone-number]");
      if (!codeSelect || !numberInput) return;

      const applyCap = () => {
        const dial = codeSelect.value || "0";
        const maxNumberDigits = Math.max(1, E164_MAX_DIGITS - dial.length);
        numberInput.setAttribute("maxlength", String(maxNumberDigits));
        if (numberInput.value.length > maxNumberDigits) {
          numberInput.value = numberInput.value.slice(0, maxNumberDigits);
        }
      };

      numberInput.addEventListener("input", () => {
        // Digits only — strips spaces, dashes, letters as the person types.
        numberInput.value = numberInput.value.replace(/\D/g, "");
        applyCap();
      });
      codeSelect.addEventListener("change", applyCap);
      applyCap();
    });
  }

  // Combines a field's selected dial code + entered digits into one
  // E.164-style value ("+2348012345678"), or "" if the number is empty.
  function getFullPhoneNumber(fieldSelector) {
    const field = root.querySelector(fieldSelector);
    if (!field) return "";
    const dial = field.querySelector("[data-phone-code]").value;
    const number = field.querySelector("[data-phone-number]").value.trim();
    return number ? `+${dial}${number}` : "";
  }

  function wireForm() {
    const form = root.querySelector("#booking-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const pkg = currentPackage();
      const buyerName = form.buyerName.value.trim();
      const buyerEmail = form.buyerEmail.value.trim();
      const buyerPhone = getFullPhoneNumber("[data-buyer-phone-field]");
      const preferredDate = form.preferredDate.value;
      const notes = form.notes.value.trim();

      if (!buyerName || !buyerEmail || !buyerPhone) {
        alert("Please fill in your name, email and phone number.");
        return;
      }
      if (!looksLikeAName(buyerName)) {
        alert("Please enter a valid name.");
        return;
      }
      if (buyerPhone.replace(/\D/g, "").length > E164_MAX_DIGITS) {
        alert("That phone number is too long. International numbers max out at 15 digits, including the country code.");
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
        bookingDetails.recipientPhone = getFullPhoneNumber("[data-recipient-phone-field]");
        bookingDetails.recipientEmail = form.recipientEmail.value.trim();
        bookingDetails.giftMessage = form.giftMessage.value.trim();
        if (!bookingDetails.recipientName) {
          alert("Please add the recipient's name.");
          return;
        }
        if (!looksLikeAName(bookingDetails.recipientName)) {
          alert("Please enter a valid name for the recipient.");
          return;
        }
        if (bookingDetails.recipientPhone.replace(/\D/g, "").length > E164_MAX_DIGITS) {
          alert("The recipient's phone number is too long. International numbers max out at 15 digits, including the country code.");
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