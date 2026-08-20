/* ==== BEGIN BLACK DOCTOR MEDIA KIT LINK BUILDER SCRIPT ==== */
/**
 * Script Purpose: Media kit link generator (/invite-link) — build a branded link from a company name
 *                 and copy it to the clipboard.
 * Author: By Default Studio
 * Created: 2025-02-05
 * Version: 2.0.0
 * Last Updated: 2026-08-20
 */

console.log("Script - Link Builder v2.0.0");

//
//------- Selectors -------//
//
// Page HTML: [data-invite-company-input] input; [data-invite-url-output] textarea;
// [data-invite-copy-button] button.

const inviteCompanyInput = "[data-invite-company-input]";
const inviteUrlOutput = "[data-invite-url-output]";
const inviteCopyButton = "[data-invite-copy-button]";
const copiedResetMs = 2000;
const copyFailResetMs = 3000;

//
//------- Utility Functions -------//
//

// Builds the branded media kit URL. Scoped to the company rather than a person because the kit gets
// forwarded around the client's organisation — see modal.js's personalisation notes.
// An empty field clears the param rather than emitting a blank one, so re-editing never duplicates.
function getInviteUrl(company) {
  const url = new URL("/", window.location.origin);
  const trimmed = (company || "").trim();
  if (trimmed) url.searchParams.set("company", trimmed);
  return url.toString();
}

// Briefly swaps the button label, then restores it. Writes to the inner div (Webflow nests the label
// there) so copying does not flatten the button's markup.
function flashCopyLabel(btn, message, ms) {
  const labelEl = btn.firstElementChild || btn;
  const original = labelEl.textContent;
  labelEl.textContent = message;
  btn.setAttribute("aria-label", message);
  setTimeout(function () {
    labelEl.textContent = original;
    btn.removeAttribute("aria-label");
  }, ms);
}

// Fallback copy via execCommand when the Clipboard API is unavailable.
function fallbackCopy(output, btn) {
  output.select();
  output.setSelectionRange(0, 99999);
  try {
    document.execCommand("copy");
    flashCopyLabel(btn, "Copied!", copiedResetMs);
  } catch (e) {
    flashCopyLabel(btn, "Select and copy manually", copyFailResetMs);
  }
}

//
//------- Main Functions -------//
//

// Initialises the builder page. Bails on any page that is not the builder.
function initLinkBuilder() {
  const companyInput = document.querySelector(inviteCompanyInput);
  const output = document.querySelector(inviteUrlOutput);
  const copyBtn = document.querySelector(inviteCopyButton);

  if (!companyInput || !output || !copyBtn) return;

  function updateUrl() {
    output.value = getInviteUrl(companyInput.value);
  }

  updateUrl();
  setupLinkBuilderListeners(companyInput, output, copyBtn, updateUrl);
}

//
//------- Event Listeners -------//
//

// Live-updates the URL as the field changes, and wires the copy button.
function setupLinkBuilderListeners(companyInput, output, copyBtn, updateUrl) {
  companyInput.addEventListener("input", updateUrl);
  companyInput.addEventListener("change", updateUrl);

  // The form assembles a URL client-side and is never submitted to Webflow.
  const form = copyBtn.closest("form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
    });
  }

  copyBtn.addEventListener("click", function () {
    const text = output.value;
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          flashCopyLabel(copyBtn, "Copied!", copiedResetMs);
        },
        function () {
          fallbackCopy(output, copyBtn);
        }
      );
    } else {
      fallbackCopy(output, copyBtn);
    }
  });
}

//
//------- Initialize -------//
//

document.addEventListener("DOMContentLoaded", () => {
  initLinkBuilder();
});
/* ==== END BLACK DOCTOR MEDIA KIT LINK BUILDER SCRIPT ==== */
