/**
 * Script Purpose: ByDefault Animations
 * Author: Erlen Masson
 * Version: 2.1.3
 * Created: 5 Feb 2025
 * Last Updated: December 9, 2024
 */

console.log("Script - BD Animations v1.0.7");

// ------- Configurable Parameters ------- //
function getFadeStart() {
  return window.innerWidth < 768 ? "top 100%" : "top 100%";
}

function getFadeEnd() {
  return window.innerWidth < 768 ? "top 60%" : "bottom 75%";
}

function getFadeEndChars() {
  return window.innerWidth < 768 ? "top 50%" : "bottom 75%";
}

const animationStagger = { chars: 0.05, words: 0.1, lines: 0.15 };
const debounceTimeout = 150;

// Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger, SplitText);

let splitTextInstances = [];

//
//------- Animations -------//
//

function textAnimations() {
  // Select all elements with animation attributes
  const animatedElements = document.querySelectorAll("[data-bd-animate], [data-text-animate]");

  animatedElements.forEach((element) => {
    // Set the aria-label attribute to the original text
    element.setAttribute("aria-label", element.textContent);
  });

  // Base ByDefault animations (fade/slide only)
  baseTextAnimations();
  
  fadeCharacters();
  fadeWords();
  fadeLines();
  fadeRichText();
  fadeList();
  // Specialized ByDefault effects
  slideUp();
  slideDown();
  slideFromLeft();
  slideFromRight();
  scaleIn();
  rotateIn();
  expandSpacing();
  skewText();
  flipText();
  fadeInOut();
  blurIn();
  bounceIn();
  shakeText();
  flashText();
  tiltText();
  neonText();
  fadeInViewport();
}

function getScrubValue(element) {
  // Check if the attribute exists (regardless of value)
  if (!element.hasAttribute("data-bd-scrub")) {
    return undefined; // No scrub attribute at all
  }
  
  const scrubAttr = element.getAttribute("data-bd-scrub");
  
  // If attribute exists but has no value or empty string, treat as "true"
  if (!scrubAttr || scrubAttr === "") {
    return true;
  }
  
  // Check for "true" (case-insensitive)
  if (scrubAttr.toLowerCase() === "true") {
    return true;
  }
  
  // Check for numeric value
  const numericValue = parseFloat(scrubAttr);
  if (!isNaN(numericValue) && numericValue > 0) {
    // Clamp to minimum 0.1 for smoothness
    return Math.max(numericValue, 0.1);
  }
  
  // Invalid value, treat as absent
  return undefined;
}

function getDelayValue(element, defaultDelay = 0) {
  const delayAttr = element.getAttribute("data-bd-delay");
  
  if (!delayAttr) {
    return defaultDelay; // Default delay
  }
  
  const delayValue = parseFloat(delayAttr);
  
  // If NaN or negative, use default delay
  if (isNaN(delayValue) || delayValue < 0) {
    return defaultDelay;
  }
  
  return delayValue;
}

// Check if element is in viewport (2% threshold)
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  
  // Calculate how much of the element is visible
  const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
  const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
  
  // Only consider positive values (element is actually in viewport)
  if (visibleHeight <= 0 || visibleWidth <= 0) return false;
  
  // Calculate visible area percentage
  const elementArea = rect.height * rect.width;
  const visibleArea = visibleHeight * visibleWidth;
  const visiblePercentage = (visibleArea / elementArea) * 100;
  
  // Trigger when 2% or more is visible
  return visiblePercentage >= 2;
}

// Base ByDefault animations (fade/slide only)
function baseTextAnimations() {
  // Legacy shim: convert data-text-animate="element" to data-bd-animate="fade"
  document.querySelectorAll("[data-text-animate='element']").forEach((element) => {
    if (!element.hasAttribute("data-bd-animate")) {
      element.setAttribute("data-bd-animate", "fade");
    }
  });
  
  // Kill existing ScrollTriggers for fade/slide elements to prevent duplicates
  ScrollTrigger.getAll().forEach(trigger => {
    if (trigger.trigger?.matches("[data-bd-animate='fade'], [data-bd-animate='slide'], [data-bd-animate]")) {
      trigger.kill();
    }
  });
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  
  // Select all elements with data-bd-animate attribute
  const allElements = document.querySelectorAll("[data-bd-animate]");
  const fadeElements = [];
  const slideElements = [];
  
  // Categorize elements by their animation type
  allElements.forEach((element) => {
    const animateValue = element.getAttribute("data-bd-animate");
    
    // Empty attribute or "fade" = default fade behavior
    if (!animateValue || animateValue === "fade") {
      fadeElements.push(element);
    }
    // "slide" = slide behavior
    else if (animateValue === "slide") {
      slideElements.push(element);
    }
    // All other values (slide-up, tilt, etc.) are ignored - handled by specialized functions
  });
  
  // Handle reduced motion - just reveal elements without animation
  if (prefersReducedMotion) {
    [...fadeElements, ...slideElements].forEach((element) => {
      gsap.set(element, { opacity: 1, clearProps: "transform,filter" });
    });
    return; // Don't create ScrollTriggers for reduced motion
  }
  
  // Process fade elements (default behavior)
  fadeElements.forEach((element) => {
    const scrubValue = getScrubValue(element);
    const delayValue = getDelayValue(element);
    
    gsap.set(element, { opacity: 0 });
    
    const tweenConfig = {
      opacity: 1,
      duration: 0.8,
      ease: "power2.out",
      delay: delayValue,
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd()
      }
    };
    
    // Only add scrub if it's provided
    if (scrubValue !== undefined) {
      tweenConfig.scrollTrigger.scrub = scrubValue;
    } else {
      // Add once: true for non-scrub animations to prevent replay
      tweenConfig.scrollTrigger.once = true;
    }
    
    gsap.to(element, tweenConfig);
  });
  
  // Process slide elements
  slideElements.forEach((element) => {
    const scrubValue = getScrubValue(element);
    const delayValue = getDelayValue(element);
    
    gsap.set(element, { opacity: 0, y: 40 });
    
    const tweenConfig = {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
      delay: delayValue,
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd()
      }
    };
    
    // Only add scrub if it's provided
    if (scrubValue !== undefined) {
      tweenConfig.scrollTrigger.scrub = scrubValue;
    } else {
      // Add once: true for non-scrub animations to prevent replay
      tweenConfig.scrollTrigger.once = true;
    }
    
    gsap.to(element, tweenConfig);
  });
}


// Fade in elements that are already in viewport, fallback to default animation if not in view
function fadeInViewport() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  gsap.utils.toArray("[data-bd-animate='in-view'], [data-text-animate='in-view']").forEach((el) => {
    // Skip reanimation if already revealed once
    if (el.dataset.bdRevealed === "true") return;
    el.dataset.bdRevealed = "true";

    // Respect reduced motion preference
    if (prefersReduced) {
      gsap.set(el, { autoAlpha: 1, clearProps: "transform,filter" });
      return;
    }

    // If element is in viewport, use immediate animation
    if (isInViewport(el)) {
      const delay = getDelayValue(el, 0);
      const fromY = parseFloat(el.getAttribute("data-bd-from-y") || "0") || 0;
      const fromX = parseFloat(el.getAttribute("data-bd-from-x") || "0") || 0;
      const fromScale = parseFloat(el.getAttribute("data-bd-from-scale") || "1") || 1;

      gsap.fromTo(
        el,
        { autoAlpha: 0, y: fromY, x: fromX, scale: fromScale, force3D: true },
        {
          autoAlpha: 1,
          y: 0,
          x: 0,
          scale: 1,
          duration: 0.8,
          delay,
          ease: "power2.out"
        }
      );
    } else {
      // Fallback: Convert to regular fade animation by changing the attribute
      // This will be picked up by the existing baseTextAnimations system
      el.setAttribute("data-bd-animate", "fade");
    }
  });
}

// Fade by Characters
function fadeCharacters() {
  splitTextInstances.forEach((instance) => instance.revert());
  splitTextInstances = [];

  gsap.utils.toArray("[data-text-animate='chars']").forEach((element) => {
    const split = new SplitText(element, { type: "chars", tag: "span" });
    splitTextInstances.push(split);
    gsap.set(split.chars, { opacity: 0 });

    gsap.to(split.chars, {
      opacity: 1,
      ease: "power1.inOut",
      stagger: animationStagger.chars,
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEndChars(),
        scrub: getScrubValue(element),
      },
    });
    
    // Mark as bound
    element.dataset.bdBound = "1";
  });
}

// Fade by Words
function fadeWords() {
  gsap.utils.toArray("[data-text-animate='words']").forEach((element) => {
    const split = new SplitText(element, { type: "words", tag: "span" });
    splitTextInstances.push(split);
    gsap.set(split.words, { opacity: 0 });

    gsap.to(split.words, {
      opacity: 1,
      ease: "power1.inOut",
      stagger: animationStagger.words,
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd(),
        scrub: getScrubValue(element),
      },
    });
    
    // Mark as bound
    element.dataset.bdBound = "1";
  });
}

// Fade by Lines
function fadeLines() {
  gsap.utils.toArray("[data-text-animate='lines']").forEach((element) => {
    const split = new SplitText(element, { type: "lines" });
    splitTextInstances.push(split);
    gsap.set(split.lines, { opacity: 0 });

    gsap.to(split.lines, {
      opacity: 1,
      ease: "power1.inOut",
      stagger: animationStagger.lines,
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd(),
        scrub: getScrubValue(element),
      },
    });
    
    // Mark as bound
    element.dataset.bdBound = "1";
  });
}

// Fade by Rich Text Lines
function fadeRichText() {
  gsap.utils
    .toArray("[data-text-animate='rich-text']")
    .forEach((richTextElement) => {
      const elements = richTextElement.querySelectorAll(
        "h1, h2, h3, h4, h5, h6, p, span, strong, em, a, ul, ol, li, blockquote, figure"
      );
      if (elements.length === 0)
        return console.warn("No rich text elements found for animation.");

      elements.forEach((element) => {
        const split = new SplitText(element, { type: "lines", tag: "span" });
        splitTextInstances.push(split);
        gsap.set(split.lines, { opacity: 0 });

        gsap.to(split.lines, {
          opacity: 1,
          ease: "power1.inOut",
          stagger: animationStagger?.lines || 0.1,
          scrollTrigger: {
            trigger: element,
            start: getFadeStart(),
            end: getFadeEnd(),
            scrub: getScrubValue(richTextElement),
          },
        });
      });
    });
}


// Fade by List Items
function fadeList() {
  gsap.utils.toArray("[data-text-animate='list']").forEach((list) => {
    const items = gsap.utils.toArray(list.querySelectorAll("li"));
    if (items.length === 0)
      return console.warn("No list items found for animation.");

    gsap.set(items, { opacity: 0 });
    gsap.to(items, {
      opacity: 1,
      stagger: 0.2,
      ease: "power2.inOut",
      scrollTrigger: {
        trigger: list,
        start: getFadeStart(),
        end: getFadeEnd(),
        scrub: getScrubValue(list),
      },
    });
    
    // Mark as bound
    list.dataset.bdBound = "1";
  });
}

// Slide Up Animation
function slideUp() {
  gsap.utils.toArray("[data-bd-animate='slide-up']").forEach((element) => {
    // Guard against double-binding
    if (element.dataset.bdBound) return;
    
    gsap.set(element, { opacity: 0, y: 50 });

    gsap.to(element, {
      opacity: 1,
      y: 0,
      ease: "power2.out",
      delay: getDelayValue(element),
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd(),
        scrub: getScrubValue(element),
      },
    });
    
    // Mark as bound
    element.dataset.bdBound = "1";
  });
}

// Slide Down Animation
function slideDown() {
  gsap.utils.toArray("[data-bd-animate='slide-down']").forEach((element) => {
    // Guard against double-binding
    if (element.dataset.bdBound) return;
    
    gsap.set(element, { opacity: 0, y: -50 });

    gsap.to(element, {
      opacity: 1,
      y: 0,
      ease: "power2.out",
      delay: getDelayValue(element),
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd(),
        scrub: getScrubValue(element),
      },
    });
    
    // Mark as bound
    element.dataset.bdBound = "1";
  });
}

// Slide From Left Animation
function slideFromLeft() {
  gsap.utils.toArray("[data-bd-animate='slide-left']").forEach((element) => {
    // Guard against double-binding
    if (element.dataset.bdBound) return;
    
    gsap.set(element, { opacity: 0, x: -50 });

    gsap.to(element, {
      opacity: 1,
      x: 0,
      ease: "power2.out",
      delay: getDelayValue(element),
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd(),
        scrub: getScrubValue(element),
      },
    });
    
    // Mark as bound
    element.dataset.bdBound = "1";
  });
}

// Slide From Right Animation
function slideFromRight() {
  gsap.utils.toArray("[data-bd-animate='slide-right']").forEach((element) => {
    // Guard against double-binding
    if (element.dataset.bdBound) return;
    gsap.set(element, { opacity: 0, x: 50 });

    gsap.to(element, {
      opacity: 1,
      x: 0,
      ease: "power2.out",
      delay: getDelayValue(element),
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd(),
        scrub: getScrubValue(element),
      },
    });
    
    // Mark as bound
    element.dataset.bdBound = "1";
  });
}

// Scale In Animation
function scaleIn() {
  gsap.utils.toArray("[data-bd-animate='scale-in']").forEach((element) => {
    // Guard against double-binding
    if (element.dataset.bdBound) return;
    gsap.set(element, { opacity: 0, scale: 0.8 });

    gsap.to(element, {
      opacity: 1,
      scale: 1,
      ease: "power2.out",
      delay: getDelayValue(element),
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd(),
        scrub: getScrubValue(element),
      },
    });
    
    // Mark as bound
    element.dataset.bdBound = "1";
  });
}

// Rotate In Animation
function rotateIn() {
  gsap.utils.toArray("[data-bd-animate='rotate-in']").forEach((element) => {
    // Guard against double-binding
    if (element.dataset.bdBound) return;
    
    gsap.set(element, { opacity: 0, rotate: -15 });
    gsap.to(element, {
      opacity: 1,
      rotate: 0,
      ease: "power2.out",
      delay: getDelayValue(element),
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd(),
        scrub: getScrubValue(element),
      },
    });
    
    // Mark as bound
    element.dataset.bdBound = "1";
  });
}

// Expand Letter Spacing Animation
function expandSpacing() {
  gsap.utils
    .toArray("[data-bd-animate='expand-spacing']")
    .forEach((element) => {
      // Guard against double-binding
      if (element.dataset.bdBound) return;
      
      gsap.set(element, { opacity: 0, letterSpacing: "-2px" });
      gsap.to(element, {
        opacity: 1,
        letterSpacing: "normal",
        ease: "power2.out",
        delay: getDelayValue(element),
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd(),
        scrub: getScrubValue(element),
      },
      });
    });
}

// Skew Text Animation
function skewText() {
  gsap.utils.toArray("[data-bd-animate='skew']").forEach((element) => {
    // Guard against double-binding
    if (element.dataset.bdBound) return;
    gsap.set(element, { opacity: 0, skewX: "15deg" });
    gsap.to(element, {
      opacity: 1,
      skewX: "0deg",
      ease: "power2.out",
      delay: getDelayValue(element),
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd(),
        scrub: getScrubValue(element),
      },
    });
    
    // Mark as bound
    element.dataset.bdBound = "1";
  });
}

// Flip Text Animation
function flipText() {
  gsap.utils.toArray("[data-bd-animate='flip']").forEach((element) => {
    // Guard against double-binding
    if (element.dataset.bdBound) return;
    gsap.set(element, { opacity: 0, rotateX: -90 });
    gsap.to(element, {
      opacity: 1,
      rotateX: 0,
      ease: "power2.out",
      delay: getDelayValue(element),
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd(),
        scrub: getScrubValue(element),
      },
    });
    
    // Mark as bound
    element.dataset.bdBound = "1";
  });
}

// New Animations

// Fade In and Out Animation
function fadeInOut() {
  gsap.utils.toArray("[data-bd-animate='fade-in-out']").forEach((element) => {
    // Guard against double-binding
    if (element.dataset.bdBound) return;
    gsap.set(element, { opacity: 0 });
    gsap.to(element, {
      opacity: 1,
      ease: "power2.inOut",
      delay: getDelayValue(element),
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd(),
        scrub: getScrubValue(element),
      },
    });
    
    // Mark as bound
    element.dataset.bdBound = "1";
  });
}

// Blur In Animation
function blurIn() {
  gsap.utils.toArray("[data-bd-animate='blur-in']").forEach((element) => {
    // Guard against double-binding
    if (element.dataset.bdBound) return;
    gsap.set(element, { opacity: 0, filter: "blur(10px)" });
    gsap.to(element, {
      opacity: 1,
      filter: "blur(0px)",
      ease: "power2.out",
      delay: getDelayValue(element),
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd(),
        scrub: getScrubValue(element),
      },
    });
    
    // Mark as bound
    element.dataset.bdBound = "1";
  });
}

// Bounce In Animation
function bounceIn() {
  gsap.utils.toArray("[data-bd-animate='bounce-in']").forEach((element) => {
    // Guard against double-binding
    if (element.dataset.bdBound) return;
    gsap.set(element, { opacity: 0, y: 50 });

    gsap.to(element, {
      opacity: 1,
      y: 0,
      ease: "bounce.out",
      delay: getDelayValue(element),
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd(),
        scrub: getScrubValue(element),
      },
    });
    
    // Mark as bound
    element.dataset.bdBound = "1";
  });
}

// Shake Animation
function shakeText() {
  gsap.utils.toArray("[data-bd-animate='shake']").forEach((element) => {
    // Guard against double-binding
    if (element.dataset.bdBound) return;
    gsap.set(element, { x: 0 }); // Ensures the element starts at its original position
    gsap.to(element, {
      x: "+=10",
      repeat: 5,
      yoyo: true,
      ease: "power2.out",
      delay: getDelayValue(element),
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd(),
        scrub: getScrubValue(element),
      },
    });
    
    // Mark as bound
    element.dataset.bdBound = "1";
  });
}

// Flashing Text Animation
function flashText() {
  gsap.utils.toArray("[data-bd-animate='flash']").forEach((element) => {
    // Guard against double-binding
    if (element.dataset.bdBound) return;
    gsap.fromTo(
      element,
      { opacity: 0 },
      {
        opacity: 1,
        repeat: -1,
        yoyo: true,
        duration: 0.5,
        ease: "power2.out",
      }
    );
  });
}

// Neon Glow Flicker (Cyberpunk Style)
function neonText() {
  gsap.utils.toArray("[data-bd-animate='neon']").forEach((element) => {
    // Guard against double-binding
    if (element.dataset.bdBound) return;
    gsap.fromTo(
      element,
      { textShadow: "0px 0px 5px #fff, 0px 0px 10px #09F", opacity: 0.5 },
      {
        textShadow: "0px 0px 10px #fff, 0px 0px 20px #09F",
        opacity: 1,
        repeat: -1,
        yoyo: true,
        duration: 0.2,
        ease: "power2.inOut",
      }
    );
  });
}

// 3D Perspective Tilt Animation
function tiltText() {
  gsap.utils.toArray("[data-bd-animate='tilt']").forEach((element) => {
    // Guard against double-binding
    if (element.dataset.bdBound) return;
    gsap.set(element, { rotateY: 90, opacity: 0 });

    gsap.to(element, {
      rotateY: 0,
      opacity: 1,
      duration: 1,
      ease: "power2.out",
      delay: getDelayValue(element),
      scrollTrigger: {
        trigger: element,
        start: getFadeStart(),
        end: getFadeEnd(),
        scrub: getScrubValue(element),
      },
    });
    
    // Mark as bound
    element.dataset.bdBound = "1";
  });
}

// Ensure fonts are loaded before running animations
document.fonts.ready
  .then(function () {
    console.log("Fonts loaded successfully");
    textAnimations();
  })
  .catch(function () {
    console.error("Font loading error");
  });

//
//------- Resize Handling -------//
//

// Debounce function to throttle the resize event handler
function debounce(func) {
  var timer;
  return function (event) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(func, 150, event); // 150ms seems like a good sweetspot
  };
}

// Rebuild only SplitText animations on resize
function rebuildSplitTextAnimations() {
  // Revert existing SplitText instances
  splitTextInstances.forEach((instance) => instance.revert());
  splitTextInstances = [];

  // Rebuild only SplitText functions
  fadeCharacters();
  fadeWords();
  fadeLines();
  fadeRichText();
  fadeList();
}

// Optional: Define the resize event handling logic
function handleResize() {
  console.log("Window resized, refreshing animations");

  // Rebuild only SplitText (not all animations)
  rebuildSplitTextAnimations();

  // Refresh ScrollTrigger (handles all bd element-level effects)
  ScrollTrigger.refresh();
}

// Optional: Add event listener for window resize if needed
function addResizeListener() {
  window.addEventListener("resize", debounce(handleResize));
}
