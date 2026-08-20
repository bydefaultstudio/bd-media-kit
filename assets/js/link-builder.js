/* ==== BEGIN BLACK DOCTOR MEDIA KIT LINK BUILDER SCRIPT ==== */
/**
 * Script Purpose: Invite URL generator (/invite-link) — build a personalised media kit link from a
 *                 name, a company and an optional pasted media kit URL, then copy it to the clipboard.
 * Author: By Default Studio
 * Created: 2025-02-05
 * Version: 1.1.0
 * Last Updated: 2026-08-20
 */

console.log("Script - Link Builder v1.1.0");

//
//------- Selectors -------//
//
// Page HTML: [data-invite-name-input], [data-invite-company-input], [data-invite-base-input] inputs;
// [data-invite-url-output] textarea; [data-invite-copy-button] button.

const inviteNameInput = "[data-invite-name-input]";
const inviteCompanyInput = "[data-invite-company-input]";
const inviteBaseInput = "[data-invite-base-input]";
const inviteUrlOutput = "[data-invite-url-output]";
const inviteCopyButton = "[data-invite-copy-button]";
const copiedResetMs = 2000;
const copyFailResetMs = 3000;

//
//------- Utility Functions -------//
//

// Builds the personalised URL. A pasted link keeps its own params (?page=, ?product=, ?story=), so a
// deep link copied from the media kit can be personalised without anyone needing to know its slug.
// An empty field clears its param rather than emitting a blank one, so re-editing never duplicates.
function getInviteUrl(name, company, base) {
  let url;
  try {
    url = new URL((base || "").trim() || "/", window.location.origin);
  } catch (e) {
    url = new URL("/", window.location.origin);
  }

  const trimmedName = (name || "").trim();
  const trimmedCompany = (company || "").trim();

  if (trimmedName) url.searchParams.set("name", trimmedName);
  else url.searchParams.delete("name");

  if (trimmedCompany) url.searchParams.set("company", trimmedCompany);
  else url.searchParams.delete("company");

  return url.toString();
}

// Briefly swaps the button label, then restores it. Writes to the inner div (Webflow nests the
// label there) so copying does not flatten the button's markup.
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
  const nameInput = document.querySelector(inviteNameInput);
  const companyInput = document.querySelector(inviteCompanyInput);
  const baseInput = document.querySelector(inviteBaseInput);
  const output = document.querySelector(inviteUrlOutput);
  const copyBtn = document.querySelector(inviteCopyButton);

  if (!nameInput || !output || !copyBtn) return;

  function updateUrl() {
    output.value = getInviteUrl(
      nameInput.value,
      companyInput ? companyInput.value : "",
      baseInput ? baseInput.value : ""
    );
  }

  updateUrl();
  setupLinkBuilderListeners([nameInput, companyInput, baseInput], output, copyBtn, updateUrl);
}

//
//------- Event Listeners -------//
//

// Live-updates the URL as any field changes, and wires the copy button.
function setupLinkBuilderListeners(inputs, output, copyBtn, updateUrl) {
  inputs.forEach(function (input) {
    if (!input) return;
    input.addEventListener("input", updateUrl);
    input.addEventListener("change", updateUrl);
  });

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
