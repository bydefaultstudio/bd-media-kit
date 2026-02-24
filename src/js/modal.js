/* ==== BEGIN BLACK DOCTOR MEDIA KIT MODAL SCRIPT ==== */
/**
 * Script Purpose: Product overlay modal — open on card click, close with button / ESC / backdrop.
 * Author: By Default Studio
 * Created: 2025-02-22
 * Version: 1.0.0
 * Last Updated: 2025-02-22
 */

console.log("Script - Modal v1.0.0");

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
const productPayload = "[data-product=\"content\"]";
const productCard = "[data-product]:not([data-product=\"content\"])";
const focusable = "a[href], button:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";
const modalOpenClass = "is-open";
const modalAnimDuration = 0.5;
const modalAnimEase = "power2.out";
const urlParamProduct = "product";
const emailSubjectBase = "BlackDoctor Media Kit";
const storageKeyRecentlyRead = "bd-media-kit-recently-read";
const classRecentlyRead = "is-recently-read";

//
//------- Utility Functions -------//
//

// Reads product slug from current URL (?product=slug).
function getProductFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get(urlParamProduct);
  return slug && slug.trim() !== "" ? slug.trim() : null;
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
  window.location.href = "mailto:" + email + "?" + params.toString();
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

// Hides the modal: runs GSAP close animation, then removes is-open, restores scroll and focus.
function closeModal(modal) {
  if (!modal) return;

  function cleanup() {
    const contentSlot = modal.querySelector(productModalContent);
    const contentWrapper = contentSlot && contentSlot.parentElement;
    if (contentWrapper) contentWrapper.scrollTop = 0;

    modal.classList.remove(modalOpenClass);
    modal.setAttribute("aria-hidden", "true");
    lockScroll(false);
    clearUrlProduct();
    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }
    previousFocus = null;
    console.log("Modal closed");
  }

  animateModalClose(modal, cleanup);
}

// Closes the modal when Escape is pressed (only if modal is open).
function handleModalKeyDown(e, modal) {
  if (e.key === "Escape" && isModalOpen(modal)) {
    closeModal(modal);
  }
}

//
//------- Event Listeners -------//
//

// Wires up: card click → open modal; close button, backdrop click, ESC → close modal.
function setupModalListeners() {
  const modal = getProductModal();
  if (!modal) return;

  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-hidden", "true");
  modal.classList.remove(modalOpenClass);

  modal.addEventListener("keydown", function modalKeyDown(e) {
    handleModalKeyDown(e, modal);
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

// Syncs modal with URL when user navigates back/forward.
function handlePopstate() {
  const slug = getProductFromUrl();
  const modal = getProductModal();
  if (!modal) return;
  if (slug) {
    openModalBySlug(slug);
  } else if (isModalOpen(modal)) {
    closeModal(modal);
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
  applyRecentlyReadStates();
  setupPopstate();
  const slug = getProductFromUrl();
  if (slug) {
    const opened = openModalBySlug(slug);
    if (!opened) clearUrlProduct();
  }
});
/* ==== END BLACK DOCTOR MEDIA KIT MODAL SCRIPT ==== */
