
Behavior:
- If `?product=` exists on page load → open that overlay automatically
- If invalid slug → default to homepage view
- On overlay close → URL resets to base `/media-kit`

This preserves a single-page feel while allowing shareable links.

---

## 7. Information Architecture

### Categories

1. Editorial  
2. Video  
3. First Market AI Opportunities  
4. Newsletter  
5. Clinical Trials  
6. High Impact Ads & Events  

Each category:
- Has a heading
- Contains a horizontal SplideJS carousel
- Pulls from Webflow CMS (recommended)

---

## 8. Technical Stack (Webflow)

### Platform
- Built entirely inside Webflow
- Hosted on Webflow
- Uses existing Webflow Design System (required)

### Content Management
- All products stored in Webflow CMS
- Each product includes:
  - Title
  - Slug (required for deep linking)
  - Category (reference or multi-reference)
  - Thumbnail image
  - Hero image (optional)
  - Short description
  - Long description (rich text)
  - Key stats (optional fields)
  - CTA label (optional)
  - CTA link (optional)

---

## 9. Libraries

### SplideJS
Used for:
- Horizontal category carousels
- Swipe support on mobile
- Smooth transitions

Behavior:
- Desktop: 3–4 cards per view
- Tablet: 2 cards per view
- Mobile: 1 card per view

### GSAP
Used for:
- Hero entrance animations
- Card stagger reveal
- Overlay open/close transitions
- Subtle typography motion
- Optional scroll-triggered animations

Reference documentation for GSAP capabilities:  
:contentReference[oaicite:0]{index=0}

---

## 10. Overlay Requirements

### Functional
- Full-screen dialog/modal
- ARIA role="dialog"
- Focus trap inside overlay
- ESC to close
- Restore focus to originating card
- Disable background scroll

### Content Structure
- Hero image
- Product title
- Key information blocks
- Description
- CTA button(s)
- Contact anchor or open form

---

## 11. Contact Form

Fields:
- Name
- Company
- Email
- Message
- (Optional) Product of Interest (auto-filled if overlay opened)

Hosted and managed through Webflow Forms.

---

## 12. Accessibility Requirements

- WCAG 2.1 AA color contrast
- Keyboard navigable
- Proper semantic structure
- Focus states visible
- Accessible carousel controls
- Accessible overlay dialog behavior

---

## 13. Performance Requirements

- Minimal JS footprint
- Lazy-load images where possible
- Lighthouse performance target: 85+
- Avoid animation overuse
- Optimize CMS image sizes

---

## 14. Design System Requirements

- Must use the existing Black Doctor design system
- Typography scales must remain consistent
- Spacing tokens must be preserved
- Color variables must not be overridden
- No custom styling that breaks the system structure
- Animations must enhance — not conflict with — system motion guidelines

---

## 15. Timeline

**Completion Target: 2 Days (48 Hours)**

### Day 1
- Webflow CMS structure
- Category sections
- Splide carousel setup
- Overlay structure
- Base responsive layout
- Contact form integration

### Day 2
- URL deep linking logic
- Overlay open-on-load
- GSAP animations
- Accessibility pass
- Mobile QA
- Performance optimization
- Final polish

---

## 16. Known Risks

- Late content updates
- Slug inconsistencies breaking deep linking
- Overuse of animation impacting performance
- Mobile overlay layout complexity
- CMS field structure changes during build

---

## 17. Open Questions

- Confirm URL format: `?product=` (recommended)
- Should overlay include downloadable media specs?
- Any legal disclaimers required for AI or Clinical Trials?
- Should analytics track:
  - Card clicks?
  - Overlay opens?
  - CTA clicks?

---

## 18. MVP Definition (Critical for 2-Day Build)

The project is considered complete when:

- All categories are visible
- All products load from CMS
- Carousels function across breakpoints
- Overlays open and close correctly
- URL updates and opens correct overlay on load
- Contact form submits successfully
- Responsive behavior verified
- No console errors
- Stakeholder approval granted