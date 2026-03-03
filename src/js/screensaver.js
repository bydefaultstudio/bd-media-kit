/**
 * Script Purpose: Black Doctor Digital Media Kit — idle screensaver (DVD-style bouncing logo).
 * Author: By Default Studio
 * Created: 2025-02-22
 * Version: 1.0.8
 * Last Updated: 2026-02-22
 */

console.log("Script - Screensaver v1.0.8");

(function () {
  "use strict";

  const IDLE_MS = 60 * 1000;
  const SCREENSAVER_SEL = "[data-modal=\"screensaver\"]";
  const LOGO_SEL = "[data-modal=\"screensaver-logo\"]";
  const ACTIVE_CLASS = "is-active";

  const activityEvents = [
    "mousemove",
    "mousedown",
    "keydown",
    "keyup",
    "click",
    "touchstart",
    "touchmove",
    "scroll",
  ];

  let idleTimer = null;
  let animationId = null;
  let x = 0;
  let y = 0;
  let vx = 1.2;
  let vy = 1.2;

  function getScreensaver() {
    return document.querySelector(SCREENSAVER_SEL);
  }

  function getLogo() {
    return document.querySelector(LOGO_SEL);
  }

  function isScreensaverVisible() {
    const el = getScreensaver();
    return el && el.classList.contains(ACTIVE_CLASS);
  }

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(showScreensaver, IDLE_MS);
  }

  function showScreensaver() {
    const screensaver = getScreensaver();
    if (!screensaver) return;
    screensaver.classList.add(ACTIVE_CLASS);
    startBounce();
  }

  function hideScreensaver() {
    const screensaver = getScreensaver();
    if (!screensaver) return;
    screensaver.classList.remove(ACTIVE_CLASS);
    stopBounce();
  }

  function stopBounce() {
    if (animationId != null) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function startBounce() {
    const screensaver = getScreensaver();
    const logo = getLogo();
    if (!screensaver || !logo) return;

    var rect = screensaver.getBoundingClientRect();
    var logoRect = logo.getBoundingClientRect();
    var cw = rect.width;
    var ch = rect.height;
    var lw = logoRect.width;
    var lh = logoRect.height;

    if (cw <= 0 || ch <= 0 || lw <= 0 || lh <= 0) {
      animationId = requestAnimationFrame(startBounce);
      return;
    }

    x = typeof x === "number" && !isNaN(x) ? x : 0;
    y = typeof y === "number" && !isNaN(y) ? y : 0;
    if (animationId == null) {
      vx = typeof vx === "number" && vx !== 0 ? vx : 2;
      vy = typeof vy === "number" && vy !== 0 ? vy : 2;
    }

    function tick() {
      if (!isScreensaverVisible()) {
        stopBounce();
        return;
      }

      var container = getScreensaver();
      var logoEl = getLogo();
      if (!container || !logoEl) {
        stopBounce();
        return;
      }

      rect = container.getBoundingClientRect();
      logoRect = logoEl.getBoundingClientRect();
      cw = rect.width;
      ch = rect.height;
      lw = logoRect.width;
      lh = logoRect.height;

      x += vx;
      y += vy;

      if (x <= 0) {
        x = 0;
        vx = -vx;
      }
      if (x + lw >= cw) {
        x = cw - lw;
        vx = -vx;
      }
      if (y <= 0) {
        y = 0;
        vy = -vy;
      }
      if (y + lh >= ch) {
        y = ch - lh;
        vy = -vy;
      }

      logoEl.style.transform = "translate(" + x + "px, " + y + "px)";
      animationId = requestAnimationFrame(tick);
    }

    animationId = requestAnimationFrame(tick);
  }

  function isTouchDevice() {
    return "ontouchstart" in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  }

  function shouldDismissOnEvent(eventType) {
    if (isTouchDevice()) return true;
    return eventType === "click" || eventType === "keydown" || eventType === "keyup" || eventType === "scroll";
  }

  function onActivity(e) {
    resetIdleTimer();
    if (isScreensaverVisible() && shouldDismissOnEvent(e.type)) hideScreensaver();
  }

  function isScreensaverTestUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.has("screensaver");
  }

  function init() {
    var screensaver = getScreensaver();
    if (!screensaver) return;

    activityEvents.forEach(function (ev) {
      document.addEventListener(ev, onActivity, { passive: true });
    });

    resetIdleTimer();

    if (isScreensaverTestUrl()) {
      requestAnimationFrame(function () {
        showScreensaver();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
