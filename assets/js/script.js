/**
 * Script Purpose: Black Doctor Digital Media Kit — carousels, overlay, URL deep linking.
 * Author: By Default Studio
 * Created: 2025-02-22
 * Version: 1.2.1
 * Last Updated: 2026-08-20
 */

console.log("Script - v1.2.1");

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
  const instances = [];

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
    // refresh() rebuilds the arrow buttons, so the filter would otherwise strip these attributes
    slider.on("arrows:mounted", applyArrowAttributes);

    slider.mount();
    instances.push(slider);
  }

  return instances;
}

function initSliders() {
  if (typeof window.Splide === "undefined") {
    console.warn("Splide not loaded, retrying slider initialization...");
    setTimeout(initSliders, 100);
    return;
  }

  // Products: 6 category carousels, 3/2/1 per view
  const productSliders = initSplideSliders(".product-slider", {
    perPage: 3,
    breakpoints: {
      1024: { perPage: 3, perMove: 1 },
      768: { perPage: 2, perMove: 1 },
      600: { perPage: 1, perMove: 1 },
    },
  });

  // Pages: one full-width card per view; auto-advances, rewinding at the end
  // (loop + drag disabled for now — restore with type: "loop" and removing drag: false)
  initSplideSliders(".pages-slider", {
    drag: false,
    rewind: true,
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

  initProductFilter(productSliders);
}

// ------- Product brand filter ------- //
// Sticky segmented control: [data-filter="<Brand name>"] buttons filter the product carousels by the
// brand tags rendered inside each card. Nothing selected = show all; clicking the active button clears it.
// Hiding a slide with CSS is not filtering — Splide keeps it in its internal list and every measurement
// (track width, snap positions, perPage, omitEnd, arrows) goes wrong. So slides actually leave
// .splide__list, and refresh() re-collects what remains from the DOM.
// Filtered-out slides are parked in a hidden div inside the slider root: outside .splide__list, so Splide
// never sees them, but still in the document, so modal.js can find their cards for ?product= deep links.
const filterTag = "[data-filter]";
const brandTag = ".category-tag-list .category-tag";
const filterActiveClass = "is-active";
const filterAnimMs = 250;

// Trims, collapses whitespace, lowercases. Matching is exact equality, never substring —
// "blackdoctor" is a prefix of "blackdoctor pro".
function normalizeBrand(value) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

// No brand selected matches everything; otherwise the card must carry that exact brand tag.
function slideHasBrand(slide, brand) {
  if (!brand) return true;
  return Array.from(slide.querySelectorAll(brandTag)).some(
    (tag) => normalizeBrand(tag.textContent) === brand
  );
}

function initProductFilter(splides) {
  const buttons = Array.from(document.querySelectorAll(filterTag));
  if (!buttons.length || !splides.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let pendingCommit = null;
  let activeBrand = null;

  const sliders = splides.map((splide) => {
    const list = splide.root.querySelector(".splide__list");
    const park = document.createElement("div");
    park.style.display = "none";
    splide.root.appendChild(park);

    return {
      splide,
      list,
      park,
      slides: Array.from(list.querySelectorAll(":scope > .splide__slide:not(.splide__slide--clone)")),
      // The section carries the vertical padding — hiding only the slider root would leave an empty band.
      host: splide.root.closest("section") || splide.root,
    };
  });

  // Screen readers get no cue that sections vanished; the live region carries the result count.
  const status = document.createElement("div");
  status.setAttribute("role", "status");
  status.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)";
  document.body.appendChild(status);

  // Moves slides between the list and the park, hides emptied sections, and refreshes each carousel.
  // Returns how many products are left showing.
  function applyFilter(brand) {
    let total = 0;

    sliders.forEach((slider) => {
      let kept = 0;
      // appendChild moves the node, so walking the master array restores the original order.
      slider.slides.forEach((slide) => {
        if (slideHasBrand(slide, brand)) {
          slider.list.appendChild(slide);
          kept += 1;
        } else {
          // Splide numbers slide ids on mount; a parked slide keeps its old one and would collide.
          slide.removeAttribute("id");
          slider.park.appendChild(slide);
        }
      });

      // Unhide before refresh — layout maths on a display:none root is stale.
      slider.host.style.display = kept ? "" : "none";
      total += kept;
      if (!kept) return;

      // refresh() strips the list's inline style, which cancels an in-flight slide transition without
      // firing transitionend — the state would stay MOVING forever and kill that carousel's arrows and
      // drag. Cancel the motion and force IDLE first, and start the rebuilt list at the first card.
      slider.splide.Components.Move.cancel();
      slider.splide.state.set(window.Splide.STATES.IDLE);
      slider.splide.Components.Controller.setIndex(0);
      slider.splide.refresh();
    });

    // Hiding sections changes the page height; ScrollTrigger caches absolute positions and only
    // recomputes when told to (GSAP is loaded by Webflow, so guard for it).
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();

    return total;
  }

  // Only the properties this module writes — Splide keeps each slide's width and margin-right inline,
  // so anything that clears the whole style attribute would strip the carousel's own layout.
  function clearSlideStyle(slide) {
    ["transition", "opacity", "transform", "pointer-events"].forEach((prop) => {
      slide.style.removeProperty(prop);
    });
  }

  // Rebuilds the carousels, then fades the surviving cards back in.
  function commitFilter(brand) {
    const total = applyFilter(brand);

    const showing = [];
    sliders.forEach((slider) => {
      slider.slides.forEach((slide) => {
        clearSlideStyle(slide);
        if (slide.parentElement === slider.list) showing.push(slide);
      });
    });

    if (showing.length && !reduceMotion.matches) {
      showing.forEach((slide) => {
        slide.style.opacity = "0";
      });
      // Force a style flush so opacity:0 is the state the transition starts from — without it both
      // writes collapse into one change and the cards pop in instead of fading.
      void sliders[0].list.offsetWidth;
      showing.forEach((slide) => {
        slide.style.transition = "opacity " + filterAnimMs + "ms";
        slide.style.removeProperty("opacity");
      });
    }

    status.textContent = brand ? "Showing " + total + " products" : "Showing all products";
  }

  function setFilter(brand) {
    activeBrand = brand;
    // One commit in flight at a time — a newer click replaces the pending one.
    clearTimeout(pendingCommit);

    buttons.forEach((btn) => {
      const isActive = normalizeBrand(btn.getAttribute("data-filter")) === brand;
      btn.classList.toggle(filterActiveClass, isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    // Cards on their way out fade and shrink first; the reflow happens once they are gone.
    const leaving = [];
    sliders.forEach((slider) => {
      slider.slides.forEach((slide) => {
        if (slide.parentElement === slider.list && !slideHasBrand(slide, brand)) leaving.push(slide);
      });
    });

    if (!leaving.length || reduceMotion.matches) {
      commitFilter(brand);
      return;
    }

    leaving.forEach((slide) => {
      slide.style.transition =
        "opacity " + filterAnimMs + "ms, transform " + filterAnimMs + "ms";
      slide.style.opacity = "0";
      slide.style.transform = "scale(0.96)";
      // A fading card must not still open its modal and leave focus stranded in the park.
      slide.style.pointerEvents = "none";
    });
    pendingCommit = setTimeout(() => commitFilter(brand), filterAnimMs);
  }

  function handleFilterClick(brand) {
    setFilter(brand === activeBrand ? null : brand);
  }

  buttons.forEach((btn) => {
    const brand = normalizeBrand(btn.getAttribute("data-filter"));
    // The Webflow elements are divs, so they need button semantics and key handling of their own.
    btn.setAttribute("role", "button");
    btn.setAttribute("tabindex", "0");
    btn.setAttribute("aria-pressed", "false");
    btn.classList.remove(filterActiveClass);
    btn.addEventListener("click", () => handleFilterClick(brand));
    btn.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      handleFilterClick(brand);
    });
  });

  const group = buttons[0].parentElement;
  if (group) {
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", "Filter products by brand");
  }
}
// ------- Sticky bar reveal ------- //
// The bar sits one bar-height above the viewport (CSS transform on .stickybar) until #brands scrolls up
// to meet it, then slides in and stays down for the rest of the page. ScrollTrigger rather than a scroll
// listener: ScrollSmoother fakes scroll position with a transform, and ScrollTrigger stays in sync with
// it and re-measures on resize — including when the brand filter hides sections and shifts #brands.
const stickybarSelector = ".stickybar";
const stickybarTriggerSelector = "#categories";
const stickybarVisibleClass = "is-visible";
const stickybarMaxRetries = 20; // ~2s waiting for Webflow to load GSAP

function initStickybarReveal(attempt = 0) {
  const bar = document.querySelector(stickybarSelector);
  if (!bar) return;

  // Any failure below leaves the bar showing — never strand the filter off-screen.
  const trigger = document.querySelector(stickybarTriggerSelector);
  if (!trigger) {
    bar.classList.add(stickybarVisibleClass);
    return;
  }

  if (typeof window.ScrollTrigger === "undefined") {
    if (attempt < stickybarMaxRetries) {
      setTimeout(() => initStickybarReveal(attempt + 1), 100);
    } else {
      console.warn("ScrollTrigger not loaded, sticky bar left visible");
      bar.classList.add(stickybarVisibleClass);
    }
    return;
  }

  // === true matters: classList.toggle() with an undefined force argument flips the class instead of
  // clearing it, and isActive is undefined until the first refresh has run.
  const syncBar = (self) => bar.classList.toggle(stickybarVisibleClass, self.isActive === true);

  window.ScrollTrigger.create({
    trigger: trigger,
    // Function form so the bar's own height is re-read on every refresh (responsive + filter changes).
    start: () => "top " + bar.offsetHeight + "px",
    end: "max",
    onToggle: syncBar,
    // Fires on the initial calculation and after every later refresh (ScrollSmoother starting up, a
    // resize, or the brand filter hiding sections) — this is what sets the state on load.
    onRefresh: syncBar,
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
        // Webflow's runtime smooth-scrolls same-page hash links from a document-level listener, and it knows
        // nothing about scroll-margin — left alone it re-scrolls to the raw section top and undoes the offset
        // that keeps the heading clear of the fixed sticky bar. preventDefault does not stop it; only
        // stopping the bubble does. The offset itself is Webflow-side: scroll-margin-top on .section, which
        // also covers hash-on-load and back-button restores. (ScrollSmoother is loaded on this site but never
        // instantiated — if that ever changes it transforms #smooth-content instead of scrolling the
        // document, ignores scroll-margin, and this needs smoother.scrollTo with an explicit offset.)
        e.stopPropagation();
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
  initStickybarReveal();
  initFullscreen();
  initCategoryAnchors();
});