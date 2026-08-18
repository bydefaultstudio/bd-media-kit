/* ==== BEGIN BLACK DOCTOR MEDIA KIT MODAL SCRIPT ==== */
/**
 * Script Purpose: Product overlay modal — open on card click, close with button / ESC / backdrop.
 * Author: By Default Studio
 * Created: 2025-02-22
 * Version: 1.0.8
 * Last Updated: 2026-02-22
 */

console.log("Script - Modal v1.0.8");

//
//------- Selectors -------//
//
// Modal: [data-modal="content"] is the slot we fill. Card: [data-product] with a slug; inside it [data-product="content"] (product_content) holds the payload to inject.

const productModal = "[data-modal=\"modal\"]";
const productModalClose = "[data-modal=\"close\"]";
const productModalOverlay = "[data-modal=\"overlay\"]";
const productModalWrapper = "[data-modal=\"wrapper\"]";
const productModalContent = "[data-modal=\"content\"]";
const productModalEmailBtn = "[data-modal=\"email-btn\"]";
const productModalCopyBtn = "[data-modal=\"copy-btn\"]";

// Contact modal (same inner structure: close, overlay, wrapper)
const contactModal = "[data-modal=\"contact\"]";
const contactOpenBtn = "[data-modal=\"contact-open\"]";
const productPayload = "[data-product=\"content\"]";
const productCard = "[data-product]:not([data-product=\"content\"])";

// Page modal (about-style content): [data-modal="page"] root; cards [data-page="slug"], payload [data-page="content"]; open trigger [data-modal="page-open"].
const pageModal = "[data-modal=\"page\"]";
const pageOpenBtn = "[data-modal=\"page-open\"]";
const pagePayload = "[data-page=\"content\"]";
const pageCard = "[data-page]:not([data-page=\"content\"])";
const focusable = "a[href], button:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";
const modalOpenClass = "is-open";
const modalAnimDuration = 0.5;
const modalAnimEase = "power2.out";
const urlParamProduct = "product";
const urlParamPage = "page";
const urlParamIntro = "intro";
const emailSubjectBase = "BlackDoctor Media Kit";
const storageKeyRecentlyRead = "bd-media-kit-recently-read";
const classRecentlyRead = "is-recently-read";

// Intro modal (first-visit: name + email; stored in localStorage and used to prefill contact form)
// HTML: [data-modal="intro"] root; inner [data-modal="close"], [data-modal="overlay"], [data-modal="wrapper"];
//       form [data-modal="intro-form"] with inputs [data-modal="intro-name"], [data-modal="intro-email"].
//       Optional: data-intro-auto-open="true" = auto-open for first-time visitors; "false" or omit = intro only via ?intro=1.
const introModal = "[data-modal=\"intro\"]";
const introForm = "[data-modal=\"intro-form\"]";
const introName = "[data-modal=\"intro-name\"]";
const introEmail = "[data-modal=\"intro-email\"]";
const keyVisitor = "bd-media-kit-visitor";
const keyIntroDismissed = "bd-media-kit-intro-dismissed";

// Contact form prefill
const contactName = "[data-modal=\"contact-name\"]";
const contactEmail = "[data-modal=\"contact-email\"]";

const successSel = ".success-message";
const autoOpenAttr = "data-intro-auto-open";
const closeDelaySec = 2;

//
//------- Utility Functions -------//
//

// Reads product slug from current URL (?product=slug).
function getProductFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get(urlParamProduct);
  return slug && slug.trim() !== "" ? slug.trim() : null;
}

// Reads page slug from current URL (?page=slug).
function getPageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get(urlParamPage);
  return slug && slug.trim() !== "" ? slug.trim() : null;
}

// True if URL has ?intro=1 or ?intro=true (share link that forces the intro modal to open).
function getIntroFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const v = params.get(urlParamIntro);
  return v === "1" || v === "true";
}

// Updates URL to include ?page=slug (pushState).
function setUrlPage(slug) {
  const url = new URL(window.location.href);
  if (slug) {
    url.searchParams.set(urlParamPage, slug);
  } else {
    url.searchParams.delete(urlParamPage);
  }
  const path = url.pathname + url.search;
  window.history.pushState({ page: slug }, "", path);
}

// Removes page param from URL (pushState).
function clearUrlPage() {
  const url = new URL(window.location.href);
  url.searchParams.delete(urlParamPage);
  const path = url.pathname + (url.search || "");
  window.history.pushState({ page: null }, "", path);
}

// Updates URL to include ?product=slug (pushState).
function setUrlProduct(slug) {
  const url = new URL(window.location.href);
  if (slug) {
    url.searchParams.set(urlParamProduct, slug);
  } else {
    url.searchParams.delete(urlParamProduct);
  }
  const path = url.pathname + url.search;
  window.history.pushState({ product: slug }, "", path);
}

// Removes product param from URL (pushState base URL).
function clearUrlProduct() {
  const url = new URL(window.location.href);
  url.searchParams.delete(urlParamProduct);
  const path = url.pathname + (url.search || "");
  window.history.pushState({ product: null }, "", path);
}

// Returns array of recently read slugs from localStorage.
function getRecentlyReadSlugs() {
  try {
    const raw = localStorage.getItem(storageKeyRecentlyRead);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// Appends slug to recently read list and saves to localStorage.
function markRecentlyRead(slug) {
  if (!slug) return;
  const slugs = getRecentlyReadSlugs();
  const next = slugs.filter(function (s) { return s !== slug; });
  next.unshift(slug);
  try {
    localStorage.setItem(storageKeyRecentlyRead, JSON.stringify(next.slice(0, 50)));
  } catch (e) {}
}

// Adds classRecentlyRead to cards whose data-product is in the recently read list.
function applyRecentlyReadStates() {
  const slugs = getRecentlyReadSlugs();
  if (!slugs.length) return;
  document.querySelectorAll(productCard).forEach(function (card) {
    const slug = card.getAttribute("data-product");
    if (slug && slugs.indexOf(slug) !== -1) {
      card.classList.add(classRecentlyRead);
    }
  });
}

// --- Intro modal & visitor storage ---

// Returns stored visitor { name, email } or null.
function getStoredVisitor() {
  try {
    const raw = localStorage.getItem(keyVisitor);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.name === "string" && typeof parsed.email === "string") {
      return { name: parsed.name.trim(), email: parsed.email.trim() };
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Saves visitor to localStorage.
function setStoredVisitor(obj) {
  if (!obj || typeof obj.name !== "string" || typeof obj.email !== "string") return;
  try {
    localStorage.setItem(keyVisitor, JSON.stringify({
      name: obj.name.trim(),
      email: obj.email.trim(),
    }));
  } catch (e) {}
}

// Returns true if user closed intro without submitting.
function getIntroDismissed() {
  try {
    return localStorage.getItem(keyIntroDismissed) === "true";
  } catch (e) {
    return false;
  }
}

// Marks intro as dismissed (closed without submit).
function setIntroDismissed() {
  try {
    localStorage.setItem(keyIntroDismissed, "true");
  } catch (e) {}
}

// True when we should auto-open the intro modal (first visit, not dismissed).
function shouldShowIntro() {
  return !getStoredVisitor() && !getIntroDismissed();
}

// True when the intro modal has data-intro-auto-open="true". "false" or omit = default (intro only via ?intro=1).
function introModalHasAutoOpen() {
  const el = getIntroModal();
  if (!el || !el.hasAttribute(autoOpenAttr)) return false;
  return (el.getAttribute(autoOpenAttr) || "").toLowerCase() === "true";
}

// Returns the intro modal element.
function getIntroModal() {
  return document.querySelector(introModal);
}

// Returns the first and last focusable elements inside a container (used for focus trap).
function getFocusBoundaries(container) {
  if (!container) return { first: null, last: null };
  const list = Array.from(container.querySelectorAll(focusable)).filter(
    function (el) {
      return el.offsetParent !== null && !el.hasAttribute("disabled");
    }
  );
  return {
    first: list[0] || null,
    last: list[list.length - 1] || null,
  };
}

// Returns the product card element for a given slug, or null.
function getCardBySlug(slug) {
  if (!slug) return null;
  const cards = document.querySelectorAll(productCard);
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].getAttribute("data-product") === slug) return cards[i];
  }
  return null;
}

// Returns a display name for the product: from card title (data-product-title or .product_card-title) or formatted slug.
function getProductDisplayName(slug) {
  const card = getCardBySlug(slug);
  if (card) {
    const titleEl = card.querySelector("[data-product-title], .product_card-title");
    if (titleEl) {
      const name = titleEl.getAttribute("data-product-title") || (titleEl.textContent || "").trim();
      if (name) return name;
    }
  }
  if (!slug) return "";
  return slug
    .split("-")
    .map(function (word) { return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); })
    .join(" ");
}

// Builds mailto subject: "Black Doctor Media Kit" or "Black Doctor Media Kit - [Product Name]".
function getEmailSubject() {
  const slug = getProductFromUrl();
  if (!slug) return emailSubjectBase;
  const name = getProductDisplayName(slug);
  return name ? emailSubjectBase + " - " + name : emailSubjectBase;
}

// Opens email client with dynamic subject. btn is the element with data-modal="email-btn".
// Uses encodeURIComponent for subject (and any other params) so spaces are %20, not + — fixes plus signs in subject on mobile/non-default mail clients.
function handleEmailBtnClick(e, btn) {
  e.preventDefault();
  const href = (btn.getAttribute("href") || "").trim();
  const subject = getEmailSubject();
  let email = "sales@blackdoctor.com";
  let params = new URLSearchParams();
  if (href.indexOf("mailto:") === 0) {
    const match = href.match(/^mailto:([^?]*)(\?.*)?$/);
    if (match && match[1]) email = match[1].trim() || email;
    if (match && match[2]) params = new URLSearchParams(match[2].slice(1));
  }
  params.set("subject", subject);
  const parts = [];
  params.forEach(function (value, key) {
    parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
  });
  window.location.href = "mailto:" + email + "?" + parts.join("&");
}

// Copies URL to clipboard, then shows .copied child on the button for a few seconds. btn has data-modal="copy-btn" and contains .copied.
function handleCopyBtnClick(e, btn) {
  e.preventDefault();
  const url = window.location.href;

  function tryFallbackCopy() {
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    let didCopy = false;
    try {
      didCopy = document.execCommand("copy");
    } catch (err) {}
    document.body.removeChild(textarea);
    return didCopy;
  }

  function doFeedback() {
    urlCopied(btn);
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(doFeedback, function () {
      if (tryFallbackCopy()) doFeedback();
    });
  } else {
    if (tryFallbackCopy()) doFeedback();
  }
}

// Shows the .copied child inside the given element for a few seconds, then hides it. Call this from your copy button’s click handler.
const urlCopiedShowDuration = 2500;

function urlCopied(btn) {
  if (!btn) return;
  const copiedEl = btn.querySelector(".copied");
  if (!copiedEl) return;
  copiedEl.classList.add("is-visible");
  copiedEl.setAttribute("aria-hidden", "false");
  console.log("Modal — .copied is-visible activated");
  if (window._urlCopiedTimer) clearTimeout(window._urlCopiedTimer);
  window._urlCopiedTimer = setTimeout(function () {
    copiedEl.classList.remove("is-visible");
    copiedEl.setAttribute("aria-hidden", "true");
    window._urlCopiedTimer = null;
  }, urlCopiedShowDuration);
}

//
//------- Modal (open / close) -------//
//

let previousFocus = null;

// Returns the product modal element from the DOM.
function getProductModal() {
  return document.querySelector(productModal);
}

// Returns the contact modal element from the DOM.
function getContactModal() {
  return document.querySelector(contactModal);
}

function getPageModal() {
  return document.querySelector(pageModal);
}

// Returns true if the modal is currently open (aria-hidden is not "true").
function isModalOpen(modal) {
  return modal && modal.getAttribute("aria-hidden") !== "true";
}

// Locks or unlocks background scroll when modal is open/closed.
function lockScroll(lock) {
  document.documentElement.style.overflow = lock ? "hidden" : "";
  document.body.style.overflow = lock ? "hidden" : "";
}

// Keeps Tab/Shift+Tab inside the modal (focus trap).
function handleTrapKeyDown(container, e) {
  if (e.key !== "Tab") return;
  const bounds = getFocusBoundaries(container);
  if (!bounds.first && !bounds.last) return;
  if (e.shiftKey) {
    if (document.activeElement === bounds.first) {
      e.preventDefault();
      if (bounds.last) bounds.last.focus();
    }
  } else {
    if (document.activeElement === bounds.last) {
      e.preventDefault();
      if (bounds.first) bounds.first.focus();
    }
  }
}

// Moves focus into the modal and traps it there until modal is closed.
function trapFocus(container) {
  if (!container) return;
  function boundKeyDown(e) {
    handleTrapKeyDown(container, e);
  }
  container.addEventListener("keydown", boundKeyDown, true);
  const bounds = getFocusBoundaries(container);
  if (bounds.first) bounds.first.focus();
}

// Clones everything inside the card's [data-product="content"] into the modal's [data-modal="content"] slot.
function injectContent(modal, card) {
  const payload = card ? card.querySelector(productPayload) : null;
  const slot = modal ? modal.querySelector(productModalContent) : null;
  if (!payload || !slot) return;
  slot.innerHTML = "";
  const children = Array.from(payload.children);
  children.forEach(function (child) {
    slot.appendChild(child.cloneNode(true));
  });
}

// Clones everything inside the card's [data-page="content"] into the page modal's [data-modal="content"] slot.
function injectPageContent(modal, card) {
  const payload = card ? card.querySelector(pagePayload) : null;
  const slot = modal ? modal.querySelector(productModalContent) : null;
  if (!payload || !slot) return;
  slot.innerHTML = "";
  const children = Array.from(payload.children);
  children.forEach(function (child) {
    slot.appendChild(child.cloneNode(true));
  });
}

// Animates overlay fade in and wrapper slide up from 100% below. No-op if GSAP missing.
function animateModalOpen(modal) {
  const gsap = window.gsap;
  const overlay = modal.querySelector(productModalOverlay);
  const wrapper = modal.querySelector(productModalWrapper);
  if (!gsap || !overlay || !wrapper) return;

  gsap.killTweensOf([overlay, wrapper]);
  gsap.set(overlay, { opacity: 0 });
  gsap.set(wrapper, { y: "100%" });

  gsap.to(overlay, {
    opacity: 1,
    duration: modalAnimDuration,
    ease: modalAnimEase,
  });
  gsap.to(wrapper, {
    y: "0%",
    duration: modalAnimDuration,
    ease: modalAnimEase,
  });
}

// Animates overlay fade out and wrapper slide down, then runs cleanup (class, scroll, focus).
function animateModalClose(modal, onComplete) {
  const gsap = window.gsap;
  const overlay = modal.querySelector(productModalOverlay);
  const wrapper = modal.querySelector(productModalWrapper);
  if (!gsap || !overlay || !wrapper) {
    if (onComplete) onComplete();
    return;
  }

  gsap.killTweensOf([overlay, wrapper]);

  gsap.to(overlay, {
    opacity: 0,
    duration: modalAnimDuration,
    ease: "power2.in",
  });
  gsap.to(wrapper, {
    y: "100%",
    duration: modalAnimDuration,
    ease: "power2.in",
    onComplete: onComplete,
  });
}

// Shows the modal (adds is-open), injects card content, runs GSAP open animation, locks scroll, traps focus. Pass true as third arg to skip URL update (e.g. when opening from URL).
function openModal(modal, card, skipUrlUpdate) {
  if (!modal) return;
  previousFocus = document.activeElement;
  if (card) injectContent(modal, card);
  modal.classList.add(modalOpenClass);
  modal.setAttribute("aria-hidden", "false");
  lockScroll(true);
  trapFocus(modal);
  animateModalOpen(modal);
  if (card) {
    const slug = card.getAttribute("data-product");
    if (slug) {
      if (!skipUrlUpdate) setUrlProduct(slug);
      markRecentlyRead(slug);
      card.classList.add(classRecentlyRead);
      console.log("Modal opened — product:", slug);
    }
  }
}

// Finds the card with data-product=slug and opens the modal with it (skips URL update).
function openModalBySlug(slug) {
  const modal = getProductModal();
  if (!modal || !slug) return false;
  const cards = document.querySelectorAll(productCard);
  let card = null;
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].getAttribute("data-product") === slug) {
      card = cards[i];
      break;
    }
  }
  if (!card) return false;
  openModal(modal, card, true);
  return true;
}

// Hides the modal: runs GSAP close animation, then removes is-open, restores scroll and focus. Optional onClosed callback runs after cleanup.
function closeModal(modal, onClosed) {
  if (!modal) return;

  function cleanup() {
    const contentSlot = modal.querySelector(productModalContent);
    const contentWrapper = contentSlot && contentSlot.parentElement;
    if (contentWrapper) contentWrapper.scrollTop = 0;

    modal.classList.remove(modalOpenClass);
    modal.setAttribute("aria-hidden", "true");
    if ((!getContactModal() || !isModalOpen(getContactModal())) &&
        (!getIntroModal() || !isModalOpen(getIntroModal())) &&
        (!getPageModal() || !isModalOpen(getPageModal()))) {
      lockScroll(false);
    }
    clearUrlProduct();
    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
    previousFocus = null;
    console.log("Modal closed");
    if (typeof onClosed === "function") onClosed();
  }

  animateModalClose(modal, cleanup);
}

// Opens the contact modal (same animation and pattern as product modal). Can be opened from home or from inside the product modal.
// Prefills name and email from stored visitor data if present.
function openContactModal() {
  const contactEl = getContactModal();
  if (!contactEl) return;
  previousFocus = document.activeElement;
  contactEl.classList.add(modalOpenClass);
  contactEl.setAttribute("aria-hidden", "false");
  lockScroll(true);
  trapFocus(contactEl);
  animateModalOpen(contactEl);
  prefillContactForm();
  console.log("Modal opened — contact");
}

// Opens the page modal (about-style). If card is provided, injects that card's [data-page="content"]; else injects from first page card (e.g. for data-modal="page-open"). Pass true as second arg to skip URL update (e.g. when opening from URL).
function openPageModal(card, skipUrlUpdate) {
  const pageEl = getPageModal();
  if (!pageEl) return;
  const cardToUse = card || document.querySelector(pageCard);
  previousFocus = document.activeElement;
  if (cardToUse) injectPageContent(pageEl, cardToUse);
  pageEl.classList.add(modalOpenClass);
  pageEl.setAttribute("aria-hidden", "false");
  lockScroll(true);
  trapFocus(pageEl);
  animateModalOpen(pageEl);
  if (cardToUse && !skipUrlUpdate) {
    const slug = cardToUse.getAttribute("data-page");
    if (slug) setUrlPage(slug);
  }
  console.log("Modal opened — page", cardToUse ? cardToUse.getAttribute("data-page") : "");
}

// Finds the page card with data-page=slug and opens the page modal with it (skips URL update).
function openPageModalBySlug(slug) {
  const pageEl = getPageModal();
  if (!pageEl || !slug) return false;
  const cards = document.querySelectorAll(pageCard);
  let card = null;
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].getAttribute("data-page") === slug) {
      card = cards[i];
      break;
    }
  }
  if (!card) return false;
  openPageModal(card, true);
  return true;
}

// Hides the page modal; restores scroll only if no other modal is open.
function closePageModal() {
  const pageEl = getPageModal();
  if (!pageEl) return;

  function cleanup() {
    const contentSlot = pageEl.querySelector(productModalContent);
    const contentWrapper = contentSlot && contentSlot.parentElement;
    if (contentWrapper) contentWrapper.scrollTop = 0;
    pageEl.classList.remove(modalOpenClass);
    pageEl.setAttribute("aria-hidden", "true");
    clearUrlPage();
    if ((!getProductModal() || !isModalOpen(getProductModal())) &&
        (!getContactModal() || !isModalOpen(getContactModal())) &&
        (!getIntroModal() || !isModalOpen(getIntroModal()))) {
      lockScroll(false);
    }
    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
    previousFocus = null;
    console.log("Modal closed — page");
  }

  animateModalClose(pageEl, cleanup);
}

// Hides the contact modal; restores scroll only if product modal is not open.
function closeContactModal() {
  const contactEl = getContactModal();
  if (!contactEl) return;

  function cleanup() {
    const wrapper = contactEl.querySelector(productModalWrapper);
    if (wrapper) wrapper.scrollTop = 0;
    contactEl.classList.remove(modalOpenClass);
    contactEl.setAttribute("aria-hidden", "true");
    if ((!getProductModal() || !isModalOpen(getProductModal())) &&
        (!getIntroModal() || !isModalOpen(getIntroModal())) &&
        (!getPageModal() || !isModalOpen(getPageModal()))) {
      lockScroll(false);
    }
    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
    previousFocus = null;
    console.log("Modal closed — contact");
  }

  animateModalClose(contactEl, cleanup);
}

// Prefills the contact (enquiry) form with stored visitor name and email.
function prefillContactForm() {
  const visitor = getStoredVisitor();
  if (!visitor) return;
  const contactEl = getContactModal();
  if (!contactEl) return;
  const nameInput = contactEl.querySelector(contactName);
  const emailInput = contactEl.querySelector(contactEmail);
  if (nameInput && visitor.name) nameInput.value = visitor.name;
  if (emailInput && visitor.email) emailInput.value = visitor.email;
  console.log("[testing] Contact form fields updated", { name: visitor.name, email: visitor.email });
}

// Opens the intro modal (first-visit name/email collection). Same animation and focus trap as contact.
function openIntroModal() {
  const introEl = getIntroModal();
  if (!introEl) return;
  previousFocus = document.activeElement;
  introEl.classList.add(modalOpenClass);
  introEl.setAttribute("aria-hidden", "false");
  lockScroll(true);
  trapFocus(introEl);
  animateModalOpen(introEl);
  watchIntroSuccessMessage();
  console.log("Modal opened — intro");
  console.log("[testing] Intro modal opened");
}

// Hides the intro modal; restores scroll only if product and contact modals are not open.
function closeIntroModal(dismissedWithoutSubmit) {
  const introEl = getIntroModal();
  if (!introEl) return;
  console.log("[testing] Intro modal closed", dismissedWithoutSubmit ? "(dismissed)" : "(submitted/success)");
  if (dismissedWithoutSubmit) setIntroDismissed();

  function cleanup() {
    const wrapper = introEl.querySelector(productModalWrapper);
    if (wrapper) wrapper.scrollTop = 0;
    introEl.classList.remove(modalOpenClass);
    introEl.setAttribute("aria-hidden", "true");
    if (!getProductModal() || !isModalOpen(getProductModal())) {
      if (!getContactModal() || !isModalOpen(getContactModal())) {
        if (!getPageModal() || !isModalOpen(getPageModal())) lockScroll(false);
      }
    }
    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
    previousFocus = null;
    console.log("Modal closed — intro");
  }

  animateModalClose(introEl, cleanup);
}

// ESC: when in fullscreen, browser exits fullscreen first (we do nothing). When not in fullscreen, close topmost modal (intro > contact > page > product).
function handleModalKeyDown(e) {
  if (e.key !== "Escape") return;
  const fullscreenEl =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;
  if (fullscreenEl) return;
  const introEl = getIntroModal();
  const contactEl = getContactModal();
  const pageEl = getPageModal();
  const productEl = getProductModal();
  if (introEl && isModalOpen(introEl)) {
    closeIntroModal(true);
    return;
  }
  if (contactEl && isModalOpen(contactEl)) {
    closeContactModal();
    return;
  }
  if (pageEl && isModalOpen(pageEl)) {
    closePageModal();
    return;
  }
  if (productEl && isModalOpen(productEl)) {
    closeModal(productEl);
  }
}

//
//------- Event Listeners -------//
//

// Wires up: card click → open modal; close button, backdrop click; global ESC closes topmost modal.
function setupModalListeners() {
  const modal = getProductModal();
  if (!modal) return;

  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-hidden", "true");
  modal.classList.remove(modalOpenClass);

  document.addEventListener("keydown", function globalModalKeyDown(e) {
    handleModalKeyDown(e);
  });

  const closeBtn = modal.querySelector(productModalClose);
  if (closeBtn) {
    closeBtn.addEventListener("click", function closeBtnClick() {
      closeModal(modal);
    });
  }

  modal.addEventListener("click", function modalBackdropClick(e) {
    if (e.target === modal || e.target.closest(productModalOverlay)) {
      closeModal(modal);
    }
  });

  document.querySelectorAll(productCard).forEach(function (card) {
    card.addEventListener("click", function cardClick(e) {
      e.preventDefault();
      openModal(modal, card, false);
    });
  });

  document.addEventListener("click", function emailBtnDelegated(e) {
    const btn = e.target.closest(productModalEmailBtn);
    if (btn) handleEmailBtnClick(e, btn);
  });

  document.addEventListener("click", function copyBtnDelegated(e) {
    const btn = e.target.closest(productModalCopyBtn);
    if (btn) handleCopyBtnClick(e, btn);
  });
}

// Contact modal: same structure (close, overlay, wrapper), open via data-modal="contact-open".
// The contact-open listener is always attached so the button works; if the modal is missing, openContactModal() will warn in the console.
function setupContactModalListeners() {
  const contactEl = getContactModal();
  if (contactEl) {
    contactEl.setAttribute("role", "dialog");
    contactEl.setAttribute("aria-modal", "true");
    contactEl.setAttribute("aria-hidden", "true");
    contactEl.classList.remove(modalOpenClass);

    const closeBtn = contactEl.querySelector(productModalClose);
    if (closeBtn) {
      closeBtn.addEventListener("click", function contactCloseClick() {
        closeContactModal();
      });
    }

    contactEl.addEventListener("click", function contactBackdropClick(e) {
      if (e.target === contactEl || e.target.closest(productModalOverlay)) {
        closeContactModal();
      }
    });
  }

  document.addEventListener("click", function contactOpenDelegated(e) {
    const btn = e.target.closest(contactOpenBtn);
    if (btn) {
      e.preventDefault();
      const productEl = getProductModal();
      if (productEl && isModalOpen(productEl)) {
        closeModal(productEl, openContactModal);
      } else {
        openContactModal();
      }
    }
  });
}

// Page modal: same structure (close, overlay, wrapper). Cards [data-page="slug"] inject [data-page="content"]; [data-modal="page-open"] opens with first page card.
function setupPageModalListeners() {
  const pageEl = getPageModal();
  if (pageEl) {
    pageEl.setAttribute("role", "dialog");
    pageEl.setAttribute("aria-modal", "true");
    pageEl.setAttribute("aria-hidden", "true");
    pageEl.classList.remove(modalOpenClass);

    const closeBtn = pageEl.querySelector(productModalClose);
    if (closeBtn) {
      closeBtn.addEventListener("click", function pageCloseClick() {
        closePageModal();
      });
    }

    pageEl.addEventListener("click", function pageBackdropClick(e) {
      if (e.target === pageEl || e.target.closest(productModalOverlay)) {
        closePageModal();
      }
    });
  }

  document.querySelectorAll(pageCard).forEach(function (card) {
    card.addEventListener("click", function pageCardClick(e) {
      e.preventDefault();
      openPageModal(card);
    });
  });

  document.addEventListener("click", function pageOpenDelegated(e) {
    const btn = e.target.closest(pageOpenBtn);
    if (btn) {
      e.preventDefault();
      openPageModal();
    }
  });
}

// When .success-message is visible, save name/email from form if not already saved (fallback when Webflow handles submit first), then close.
function saveIntroFormFromWrapperAndClose(introEl) {
  const wrapper = introEl.querySelector(productModalWrapper);
  if (!wrapper) return;
  const nameEl = wrapper.querySelector(introName);
  const emailEl = wrapper.querySelector(introEmail);
  const name = nameEl ? nameEl.value.trim() : "";
  const email = emailEl ? emailEl.value.trim() : "";
  if (name && email) {
    setStoredVisitor({ name, email });
    console.log("[testing] Intro form saved from success state", { name, email });
  }
  closeIntroModal(false);
}

// True when the success message element exists and is visible. Webflow often keeps the class and toggles visibility via inline style (display: block/none).
function isIntroSuccessMessageVisible(wrapper) {
  const el = wrapper.querySelector(successSel);
  if (!el) return false;
  const style = el.getAttribute("style");
  if (style && style.toLowerCase().includes("display")) {
    const match = style.match(/\bdisplay\s*:\s*([^;]+)/i);
    if (match && match[1].toLowerCase().trim() === "none") return false;
  }
  return el.offsetParent !== null;
}

// Watches for Webflow success: .success-message is always in the DOM; Webflow shows it by changing style (e.g. display: block). We observe attributes and only act when the message is visible.
function watchIntroSuccessMessage() {
  const introEl = getIntroModal();
  if (!introEl) return;
  const wrapper = introEl.querySelector(productModalWrapper);
  if (!wrapper) return;

  function checkSuccessVisible() {
    if (!isModalOpen(introEl)) return;
    if (isIntroSuccessMessageVisible(wrapper)) {
      observer.disconnect();
      const delayMs = (closeDelaySec > 0 ? closeDelaySec : 0) * 1000;
      setTimeout(function () {
        if (isModalOpen(introEl)) saveIntroFormFromWrapperAndClose(introEl);
      }, delayMs);
    }
  }

  const observer = new MutationObserver(function () {
    checkSuccessVisible();
  });

  observer.observe(wrapper, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class"],
  });
}

// Intro modal: first-visit name/email form. Close button and backdrop set intro-dismissed.
// On submit we save name/email immediately (so contact form is always populated), allow form to submit;
// when Webflow shows .success-message we close the modal.
function setupIntroModalListeners() {
  const introEl = getIntroModal();
  if (!introEl) return;

  introEl.setAttribute("role", "dialog");
  introEl.setAttribute("aria-modal", "true");
  introEl.setAttribute("aria-hidden", "true");
  introEl.classList.remove(modalOpenClass);

  const closeBtn = introEl.querySelector(productModalClose);
  if (closeBtn) {
    closeBtn.addEventListener("click", function introCloseClick() {
      closeIntroModal(true);
    });
  }

  introEl.addEventListener("click", function introBackdropClick(e) {
    if (e.target === introEl || e.target.closest(productModalOverlay)) {
      closeIntroModal(true);
    }
  });

  const form = introEl.querySelector(introForm);
  if (form) {
    // Capture phase so we run before Webflow's form handler and can save + start watching for .success-message.
    form.addEventListener("submit", function introFormSubmit(e) {
      const nameEl = introEl.querySelector(introName);
      const emailEl = introEl.querySelector(introEmail);
      const name = nameEl ? nameEl.value.trim() : "";
      const email = emailEl ? emailEl.value.trim() : "";
      if (!name || !email) {
        e.preventDefault();
        return;
      }
      console.log("[testing] Intro form submitted", { name, email });
      setStoredVisitor({ name, email });
    }, true);
  }
}

// Syncs modals with URL when user navigates back/forward.
function handlePopstate() {
  const productSlug = getProductFromUrl();
  const productEl = getProductModal();
  if (productEl) {
    if (productSlug) {
      openModalBySlug(productSlug);
    } else if (isModalOpen(productEl)) {
      closeModal(productEl);
    }
  }
  const pageSlug = getPageFromUrl();
  const pageEl = getPageModal();
  if (pageEl) {
    if (pageSlug) {
      openPageModalBySlug(pageSlug);
    } else if (isModalOpen(pageEl)) {
      closePageModal();
    }
  }
}

function setupPopstate() {
  window.addEventListener("popstate", handlePopstate);
}

//
//------- Initialize -------//
//

document.addEventListener("DOMContentLoaded", () => {
  setupModalListeners();
  setupContactModalListeners();
  setupPageModalListeners();
  setupIntroModalListeners();
  applyRecentlyReadStates();
  setupPopstate();
  const productSlug = getProductFromUrl();
  const pageSlug = getPageFromUrl();
  if (productSlug) {
    const opened = openModalBySlug(productSlug);
    if (!opened) clearUrlProduct();
  } else if (pageSlug) {
    const opened = openPageModalBySlug(pageSlug);
    if (!opened) clearUrlPage();
  } else if (getIntroFromUrl() || (introModalHasAutoOpen() && shouldShowIntro())) {
    setTimeout(openIntroModal, 150);
  }
});
/* ==== END BLACK DOCTOR MEDIA KIT MODAL SCRIPT ==== */
