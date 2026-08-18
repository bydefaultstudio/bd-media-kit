/**
 * Script Purpose: Black Doctor Digital Media Kit — carousels, overlay, URL deep linking.
 * Author: By Default Studio
 * Created: 2025-02-22
 * Version: 1.1.2
 * Last Updated: 2026-08-18
 */

console.log("Script - v1.1.2");

// ------- Sliders (SplideJS) ------- //
// Shared config for all carousels; per-type layout passed by initSliders().
const sliderBaseConfig = {
  type: "slide",
  drag: "free",
  omitEnd: true,
  snap: true,
  perMove: 1,
  gap: "2rem",
  arrows: true,
  // Right arrow (next): two paths combined; Splide mirrors for prev
  arrowPath:
    "M23.3359 31.6746L20.9788 29.3175L26.9578 23.3387H31.672L23.3359 31.6746Z M35.0054 20.0054H5V16.672H26.958L20.979 10.693L23.3359 8.33594L35.0054 20.0054Z",
  classes: {
    arrow: "button is-icon-only is-small is-faded is-outline is-pill custom-arrows",
  },
  pagination: false,
  speed: 1200,
  easing: "cubic-bezier(0.65, 0, 0.35, 1)", // easeInOutCubic — slow start and finish
  trimSpace: true,
  keyboard: true,
  focus: 0,
};

function initSplideSliders(selector, options) {
  const sliderEls = document.querySelectorAll(selector);

  for (const el of sliderEls) {
    const slider = new window.Splide(el, Object.assign({}, sliderBaseConfig, options));

    const applyArrowAttributes = () => {
      const prevArrow = slider.root.querySelector(".splide__arrow--prev");
      const nextArrow = slider.root.querySelector(".splide__arrow--next");

      if (prevArrow) {
        prevArrow.setAttribute("data-cursor", "arrow-left");
        prevArrow.setAttribute("aria-label", "Previous");
      }

      if (nextArrow) {
        nextArrow.setAttribute("data-cursor", "arrow-right");
        nextArrow.setAttribute("aria-label", "Next");
      }
    };

    slider.on("mounted", applyArrowAttributes);
    slider.on("updated", applyArrowAttributes);

    slider.mount();
  }
}

function initSliders() {
  if (typeof window.Splide === "undefined") {
    console.warn("Splide not loaded, retrying slider initialization...");
    setTimeout(initSliders, 100);
    return;
  }

  // Products: 7 category carousels, 3/2/1 per view
  initSplideSliders(".product-slider", {
    perPage: 3,
    breakpoints: {
      1024: { perPage: 3, perMove: 1 },
      768: { perPage: 2, perMove: 1 },
      600: { perPage: 1, perMove: 1 },
    },
  });

  // Pages: one full-width card per view; loops and auto-advances
  initSplideSliders(".pages-slider", {
    type: "loop",
    perPage: 1,
    gap: "1rem",
    autoplay: true,
    interval: 4000,
  });

  // Stories: 4 / 2.5 / 1.5 per view (halves via right padding — Splide perPage is integer-only)
  initSplideSliders(".stories-slider", {
    perPage: 4,
    gap: "1rem",
    arrows: false,
    breakpoints: {
      768: { perPage: 2, padding: { right: "20%" } },
      600: { perPage: 1, padding: { right: "33%" } },
    },
  });
}

// ------- Fullscreen toggle ------- //
// Button with data-fullscreen="toggle" enters/exits fullscreen (whole page). ESC exits fullscreen (browser); then ESC closes modals.
const fullscreenToggleBtn = "[data-fullscreen=\"toggle\"]";

function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null
  );
}

function requestFullscreen(el) {
  if (!el) return Promise.reject(new Error("No element"));
  return (
    el.requestFullscreen?.() ||
    el.webkitRequestFullscreen?.() ||
    el.mozRequestFullScreen?.() ||
    el.msRequestFullscreen?.() ||
    Promise.reject(new Error("Fullscreen not supported"))
  );
}

function exitFullscreen() {
  const doc = document;
  return (
    doc.exitFullscreen?.() ||
    doc.webkitExitFullscreen?.() ||
    doc.mozCancelFullScreen?.() ||
    doc.msExitFullscreen?.() ||
    Promise.resolve()
  );
}

function handleFullscreenToggle(e) {
  const btn = e.target.closest(fullscreenToggleBtn);
  if (!btn) return;
  e.preventDefault();
  if (getFullscreenElement()) {
    exitFullscreen().catch(() => {});
  } else {
    requestFullscreen(document.documentElement).catch(() => {});
  }
}

function initFullscreen() {
  document.addEventListener("click", handleFullscreenToggle);
}

// ------- Category anchor links ------- //
// Links with data-anchor="slug" (e.g. editorial, video) become anchor links to the section with id="slug".
// Category sections must have id matching the slug (e.g. id="editorial", id="video").
function initCategoryAnchors() {
  const links = document.querySelectorAll("[data-anchor]");
  links.forEach((el) => {
    const slug = (el.getAttribute("data-anchor") || "").trim();
    if (!slug) return;
    const anchor = el.tagName === "A" ? el : el.querySelector("a");
    const target = anchor || el;
    if (anchor) anchor.setAttribute("href", "#" + slug);
    target.addEventListener("click", (e) => {
      const section = document.getElementById(slug);
      if (section) {
        e.preventDefault();
        section.scrollIntoView({ behavior: "smooth", block: "start" });
        if (history.pushState) {
          history.pushState(null, "", "#" + slug);
        } else {
          window.location.hash = slug;
        }
      }
    });
  });
}

//
//------- Initialize -------//
// Screensaver: include screensaver.js for idle screensaver (data-modal="screensaver" / data-modal="screensaver-logo"); it auto-inits.
//

document.addEventListener("DOMContentLoaded", () => {
  initSliders();
  initFullscreen();
  initCategoryAnchors();
});