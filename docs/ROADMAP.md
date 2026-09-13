# kalchar Feature Roadmap

> Generated 2026-07-02 from a multi-agent deep-dive: **196 agents**, **148 ideas** across 20 product domains, RICE-scored, top 22 adversarially verified. This is a decision aid, not a commitment.

> Historical planning snapshot. Statements below about missing tests, absent lead persistence, direct schema pushes, or future backend work describe the July planning baseline, not the current application. Use [ARCHITECTURE.md](ARCHITECTURE.md), [DATABASE.md](DATABASE.md), and [REVIEW-REMEDIATION.md](REVIEW-REMEDIATION.md) for current implementation and operations.

## Strategic summary

kalchar is a mobile-first folk-art portfolio whose entire funnel dead-ends at WhatsApp, with zero durable record of any enquiry, lead, or sale. The single highest-leverage move is to stop treating "sold to WhatsApp" as the end state and start capturing intent (lead persistence, honest trust copy, share/reach surfaces) while hardening the two things that silently rot for a solo maintainer: correctness on the live catalog and a safety net (tests + typed env + versioned migrations). Adversarial verification killed or shrank several top-RICE ideas -- the immutable-cache "quick win" is a year-long data-integrity bug, the OG/PWA/scroll-padding ideas are half-real once you account for the paper-grain filter, Lenis, Satori fonts, and iOS in-app browsers -- so this roadmap deliberately down-ranks the flashy scored winners in favor of the cheap, verifiable, actually-load-bearing work. Build for the real audience (iOS/Android in-app WhatsApp/IG browsers on phones), confirm business facts with Megha before shipping any promise, and never route the WhatsApp deep-link through anything that can be blocked.

## How to read the scores

**RICE** = (Reach x Impact x Confidence) / Effort-weeks - higher is more bang-per-week. **Fit** (1-10) = alignment with house rules, mobile-first, art integrity, budget. **Verdict** = now / next / later / cut. Where adversarial verification disagreed with a high RICE score, the roadmap below trusts the *verification*, not the raw number.

## Themes

### Foundation & safety net (build this first, it de-risks everything after)

Solo maintainer, no tests, no error tracking, schema pushed straight to Neon, six scattered process.env reads with silent ?? "" fallbacks. Every later feature is safer once pure-fn tests, a typed env module, and versioned migrations exist. These are cheap, high-fit, and the adversarial notes show later ideas keep tripping on the missing test gate.

- Vitest + pure-logic unit suite for lib/ (the actual bug factory)
- Add pnpm test gate to CI between typecheck and build
- Central typed env module with @t3-oss/env-nextjs (lib/env.ts)
- Adopt versioned Drizzle migrations (db:generate + committed ./drizzle) as the prod path
- Data-seam price integrity + sold-out guard so a live-editable catalog never advertises a stale/available-but-unpriced state
- Split app/admin/actions.ts by entity before it crosses the 500-line ceiling

### Capture intent that currently evaporates

The one structural gap that matters: every enquiry, brief, and near-sale funnels to WhatsApp and is never stored. The CustomOrderDraft type already promises a Phase-2 row. Persist FIRST, then open WhatsApp exactly as today (no funnel regression), so a blocked in-app popup no longer loses the lead. This is the closest thing to analytics Megha will actually act on.

- Persist custom-order briefs as leads (finish the Phase-2 seam)
- WhatsApp enquiry hardening: make the custom-order submit a real anchor, not window.open
- Testimonials as a first-class catalog entity

### Trust & honest conversion (gated on Megha's facts)

A WhatsApp-only seller of one-of-a-kind originals lives or dies on trust. Cheap component reuse recovers the /about and /events dead-ends and surfaces authenticity -- but returns/shipping/authenticity are business commitments, not copy. Real values must be confirmed by Megha before any of it ships; keep it care-and-handling honest, no returns machinery that doesn't exist.

- Add conversion CTAs to the two storytelling dead-ends (/events internal link to /workshops, /about to /custom-orders)
- Structured shipping & care copy blocks reused on artwork detail + custom-orders (single source in site.json)
- Honest scarcity microcopy on single-original pieces (reworded to avoid the em-dash house-rule ban, gated on status available AND not sold)
- Editable Trust page: shipping, returns, care & authenticity FAQ

### Reach & discoverability for the phone audience

Traffic arrives as WhatsApp/IG link-taps on phones, so the link-preview thumbnail is the front door and cross-linking keeps people in the catalog. Verification collapsed the dynamic-OG ideas: a single hand-designed static 1200x630 JPG beats fighting Satori over the paper-grain filter and Devanagari fonts. Per-artwork OG already uses the real R2 photo -- leave it.

- Static 1200x630 branded OG card in /public referenced from layout.tsx openGraph.images (NOT the ImageResponse generator)
- VisualArtwork JSON-LD on /work/[slug]
- Product Rich Pins: og:type=product + product:price meta on /work/[slug]
- URL-param lens on WorkFilter (?style= / ?view=available) making filtered galleries shareable
- Explore this style cross-links (depends on the URL-param lens landing first)
- Per-piece Share button with native Web Share + copy-link fallback (with secure-context + clipboard-reject fallback)
- Meta Commerce catalog CSV data feed at /catalog.csv (per-row price, .jpg image_link)

### Perf & a11y hardening (measured, not assumed)

Real wins for slow Indian phones, but the adversarial pass showed the headline items are half-myths: immutable cache is a data-integrity bug on the replace-image and profile flows, scroll-padding only helps the one skip link and needs Lenis wiring, and 2 of 5 flagged contrast pairs actually pass. Ship the genuinely broken subset only.

- Cache-Control with a SHORT max-age + must-revalidate on R2 (NOT immutable) -- or immutable only on content-addressed new-slug/event/OG keys, never the shared uploadObject
- Contrast fixes for the REAL fails only: gold-leaf/marigold text-on-cream + the line border (1.36:1), light-mode only, via text-only pigment variants
- scroll-margin-top on #main for the skip link (+ Lenis offset), scoped to the one real beneficiary
- AVIF encode-quality/effort A-B pass for smaller gallery bytes
- Lightbox neighbor prefetch on hover/focus
- Motion token audit + motion-safe/motion-reduce consistency sweep

## Recommended sequence (solo dev)

### Phase 1 - Safety net & correctness (2-3 days)

- [ ] Vitest + pure-fn unit suite for lib/
- [ ] Add pnpm test gate to CI (only after the suite exists)
- [ ] Central typed env module (lib/env.ts)
- [ ] Data-seam price integrity + sold-out guard
- [ ] Motion token audit + motion-safe/motion-reduce sweep

### Phase 2 - Capture intent (3-4 days)

- [ ] Adopt versioned Drizzle migrations (needed before adding tables)
- [ ] Persist custom-order briefs as leads + /admin/leads queue
- [ ] Make the custom-order submit a real anchor (kill the window.open popup class entirely)
- [ ] Split app/admin/actions.ts by entity

### Phase 3 - Reach & front-door (2-3 days)

- [ ] Static 1200x630 branded OG JPG
- [ ] VisualArtwork JSON-LD + product:price meta on /work/[slug]
- [ ] URL-param lens on WorkFilter
- [ ] Explore this style cross-links (now that the lens exists)
- [ ] Per-piece Share button with native Web Share + robust fallback

### Phase 4 - Trust surfaces (gated on Megha's facts, 2-3 days)

- [ ] Confirm shipping/care/returns/authenticity facts with Megha (blocking input)
- [ ] Add /about and /events dead-end CTAs
- [ ] Structured shipping & care copy blocks in site.json (care-and-handling honest)
- [ ] Editable Trust/FAQ page + FAQPage JSON-LD (only if entries are real visible Q&A)
- [ ] Honest scarcity microcopy on single originals

### Phase 5 - Perf & a11y hardening, then testimonials (3-4 days)

- [ ] Cache-Control with short max-age + must-revalidate on R2 (NOT immutable on the shared writer)
- [ ] Contrast fixes for the real fails only (gold-leaf/marigold/line, light-mode)
- [ ] scroll-margin-top on #main for the skip link (+ Lenis offset)
- [ ] AVIF encode-quality A-B pass + lightbox neighbor prefetch
- [ ] Testimonials table + admin CRUD + home/detail surfacing
- [ ] Meta Commerce /catalog.csv feed (one-time Megha setup in Commerce Manager)

## Quick wins (high value, low effort - start here)

- Vitest + pure-fn suite for lib/ (whatsapp, deriveStatus, slugify, isForSale, getCtaCopy) -- 30-60 min, catches the string/number bugs that ship today with zero coverage
- Add pnpm test gate to CI AFTER the suite exists (never before -- a bare pnpm test red-gates every push)
- Static 1200x630 OG JPG in /public -- fixes the awkward square-logo chat thumbnail with zero Satori/font/grain fights
- Add CTA to /about (Commission a piece to /custom-orders) and an internal link on /events to /workshops -- pure Card + buttonVariants reuse, recovers two dead-ends
- VisualArtwork JSON-LD + product:price meta on /work/[slug] -- derived entirely from the artwork already loaded, one script block
- Typed env module (lib/env.ts) -- kills the two silent ?? "" fallbacks that can ship broken srcsets to prod
- Data-seam price/sold-out guard -- one check so an available piece can't publish without a positive price and a sold piece can't leak into the buy filter
- URL-param lens on WorkFilter -- client-side useSearchParams so /work stays static; makes filtered galleries shareable and unblocks style cross-links
- Honest scarcity microcopy, reworded to dodge the em-dash ban and gated on priceInr set AND status not sold (so sold pieces don't show 'available')
- Motion token audit -- housekeeping that makes every later motion idea consistent; ship as the foundation

## Big bets (larger investments worth committing to)

- Persist enquiries as leads (finish the Phase-2 seam): a leads table + fire-and-forget server action that writes the brief BEFORE opening WhatsApp, plus a minimal /admin/leads queue. This is the single structural gap worth closing -- it turns a WhatsApp-only funnel into a business with a record, without any funnel regression.
- Testimonials as a first-class entity: table + admin CRUD mirroring workshops/presets + data-seam readers, surfaced on home and soft-linked to artwork detail. Trust is the whole game for a WhatsApp seller of originals; this is the durable trust asset (and later unlocks Review/aggregateRating JSON-LD).
- Editable Trust/FAQ page (gated on Megha confirming real shipping/returns/authenticity facts): the honest 'how buying works' page a no-checkout gallery needs. Big only because the blocking input is business truth, not code -- do NOT publish a returns policy with no refund machinery behind it.
- Versioned Drizzle migrations as the prod path: committed ./drizzle SQL + db:migrate + a CI guard failing schema changes without a migration. It's the reviewable, rollback-able discipline every table-adding idea above quietly depends on.

## Adversarial verification - what got downgraded

These scored high on RICE but the verify pass found the optimistic case was wrong. Treat with the noted caution:

- **Real 1200x630 OG social card via app/opengraph-image** (reconsider): Technically feasible on Vercel (Next 16 ImageResponse/@vercel/og runs fine there), but the optimistic "low risk / simple" framing is wrong on three counts.

1. SATORI CANNOT REPRODUCE THE BRAND GROUND. The site's paper texture is components/decor/paper-grain.tsx -- a live SVG <feTurbulence> fractal-noise filter. Satori (the engine behind ImageResponse) does not support SVG filter primitives. So "o
- **UPI QR + amount on the receipt/enquiry for buyers who won't tap a link** (reconsider): Technically trivial on this stack (UPI intent URI is a string; QR via one ~10KB client dep; VPA stored in the existing settings KV like the profile image; zero server/gateway work). Cost and lock-in are genuinely near-zero and portable -- that part of the RICE holds. But the optimistic case breaks on four points: (1) TRUST IS BACKWARDS -- a raw QR prompting 'send Rupees X to a stranger's VPA now' on
- **WhatsApp enquiry hardening: popup-safe links + copy-message fallback across all CTAs** (reconsider): The idea's core premise is inverted. It claims the per-artwork and per-workshop CTAs are "fragile" plain `<a target=_blank>` links that "rely on the browser honoring the deep-link" -- but that IS the correct, robust pattern. A user-gesture click on a real anchor is a navigation, not a popup; in-app IG/WhatsApp webviews honor anchor navigations. Popup blockers block PROGRAMMATIC `globalThis.open()`
- **First-party enquiry-event log (enquiry_events Drizzle table + /go/wa redirect handler)** (reconsider): Technically buildable but the optimistic case is wrong on the thing that matters most: this instruments the site's #1 conversion action by inserting a server round-trip in front of it, on the worst browsers kalchar actually gets.

1. TRAFFIC-PATH REGRESSION (the big one). Today the enquiry CTAs are plain `<a href="https://wa.me/..." target="_blank">` (artwork-lightbox.tsx:337, work/[slug]/page.tsx

## Full ranked idea pool (top 60 by RICE)

| # | Verdict | RICE | Fit | Risk | Domain | Idea |
|---|---|---|---|---|---|---|
| 1 | now | 360.0 | 9 | low | perf-pwa | Set immutable Cache-Control on R2 image uploads |
| 2 | now | 144.0 | 10 | low | a11y | scroll-padding-top for the sticky header (WCAG 2.2 2.4.11 Focus Not Obscured) |
| 3 | now | 136.0 | 9 | low | a11y | Contrast + non-text-contrast audit of the oklch pigment tokens (fix the gold-leaf and vermillion-on-cream pairs) |
| 4 | now | 128.0 | 9 | low | perf-pwa | Real 1200x630 OG social card via app/opengraph-image |
| 5 | now | 102.0 | 9 | low | testing-quality | Add `pnpm test` gate to CI between typecheck and build |
| 6 | next | 96.0 | 8 | low | i18n | Devanagari (Hindi) numerals + rupee symbol in formatInr/formatEventDate, locale-aware |
| 7 | now | 86.4 | 9 | low | content-story | 1200x630 branded social share cards (dynamic OG images) via Next ImageResponse |
| 8 | next | 75.6 | 8 | medium | seo | Per-artwork dynamic OG card via opengraph-image.tsx |
| 9 | now | 75.0 | 9 | low | content-story | Add conversion CTAs to the two storytelling dead-ends (/events and /about) |
| 10 | now | 74.7 | 9 | low | conversion-trust | Editable Trust page: shipping, returns, care & authenticity FAQ (data/site.json + one route) |
| 11 | now | 74.4 | 9 | low | personalization | "Explore this style" cross-links wired through getStyleSamples() |
| 12 | now | 70.0 | 9 | low | content-story | app/manifest.ts + basic PWA install so returning WhatsApp/IG visitors can add-to-home |
| 13 | next | 68.0 | 9 | low | ux-motion | Dark-mode refinement pass: pigment luminance + shadow tuning for OLED phones |
| 14 | now | 67.2 | 9 | low | conversion-trust | Honest scarcity microcopy on single-original pieces (no timers, no fake stock) |
| 15 | now | 63.0 | 9 | low | payments-ops | UPI QR + amount on the receipt/enquiry for buyers who won't tap a link |
| 16 | next | 63.0 | 9 | low | conversion-trust | WhatsApp enquiry hardening: popup-safe links + copy-message fallback across all CTAs |
| 17 | next | 63.0 | 9 | low | social | Per-piece 'Share' button with native Web Share + copy-link fallback |
| 18 | next | 63.0 | 8 | medium | analytics | First-party enquiry-event log (enquiry_events Drizzle table + /go/wa redirect handler) |
| 19 | now | 61.3 | 9 | low | social | Meta Commerce catalog CSV data feed at /catalog.csv |
| 20 | next | 59.5 | 9 | low | ux-motion | Watercolor/pigment wash backdrops per section using layered CSS gradients (no images) |
| 21 | next | 57.6 | 8 | low | observability | /api/health route + external heartbeat (UptimeRobot free / Healthchecks.io) |
| 22 | next | 52.5 | 9 | low | trust-legal-ops | Structured shipping & care copy blocks reused on artwork detail + custom-orders (single source in site.json) |
| 23 | next | 52.0 | 9 | low | seo | VisualArtwork JSON-LD on /work/[slug] |
| 24 | next | 52.0 | 9 | low | ux-motion | Gold-leaf shimmer sweep on 'Available' badges and primary WhatsApp CTAs |
| 25 | next | 48.0 | 9 | low | perf-pwa | Lightbox neighbor prefetch on hover/focus |
| 26 | next | 47.3 | 9 | low | perf-pwa | AVIF encode-quality/effort A-B pass for smaller gallery bytes |
| 27 | next | 45.0 | 8 | low | seo | LocalBusiness / geo signals for India-based artist discoverability |
| 28 | next | 44.6 | 8 | low | ux-motion | Per-style pigment theming via a style→pigment token map |
| 29 | later | 44.0 | 7 | medium | engagement-retention | Persist the custom-order draft in localStorage so a blocked WhatsApp popup isn't lost work |
| 30 | now | 38.4 | 9 | medium | marketing-growth | Persist custom-order briefs as leads (finish the Phase-2 seam) |
| 31 | next | 37.8 | 9 | low | ecommerce | Server-side 'reserve' state to stop double-selling during a live enquiry |
| 32 | now | 36.8 | 9 | low | conversion-trust | Testimonials as a first-class catalog entity (testimonials table + data seam + home/detail surfacing) |
| 33 | next | 36.0 | 9 | low | testing-quality | Vitest + pure-logic unit suite for lib/ (the actual bug factory) |
| 34 | next | 35.0 | 9 | low | seo | FAQPage JSON-LD on /custom-orders (and shipping/returns answers) |
| 35 | cut | 35.0 | 6 | low | perf-pwa | LCP audit + explicit width/height on hero and detail plates to kill CLS |
| 36 | next | 32.7 | 9 | low | marketing-growth | Email list capture via a free provider (MailerLite/Buttondown), not a raw broadcast build |
| 37 | next | 32.0 | 7 | low | a11y | Screen-reader announcements + prefers-reduced-motion parity for the WhatsApp popup / mailto fallback flow |
| 38 | next | 31.5 | 9 | low | architecture-dx | Adopt versioned Drizzle migrations (db:generate + committed ./drizzle) as the prod path |
| 39 | next | 28.3 | 8 | low | a11y | Skip-to-region links + landmark audit beyond the single skip-to-content |
| 40 | next | 28.0 | 9 | low | personalization | "Recently viewed" rail (localStorage, cookie-free) |
| 41 | next | 28.0 | 5 | medium | testing-quality | Playwright e2e smoke: WhatsApp deep-link href correctness across every conversion path |
| 42 | next | 26.7 | 8 | low | seo | BreadcrumbList JSON-LD on /work/[slug] and /events/[id] |
| 43 | next | 26.7 | 7 | low | testing-quality | requireMaintainer / isMaintainer auth-guard test (email normalization + root lockout) |
| 44 | now | 26.7 | 9 | low | trust-legal-ops | MDX-backed legal pages via a `legal` route group (Privacy, Terms, Shipping & Returns, Refund/Grievance) |
| 45 | next | 26.3 | 8 | low | ecommerce | Sold-out automation + waitlist deep-link on the detail page |
| 46 | later | 26.3 | 7 | low | conversion-trust | Trust-signal footer row: verified channels, location, 'ships from India' with lightweight badges |
| 47 | next | 25.2 | 9 | low | content-story | lite-youtube facade embeds (process reels) on artwork detail, journal, and a Watch strip |
| 48 | next | 25.0 | 8 | low | i18n | Transliterated slugs + Hindi keyword aliases for artwork search discoverability |
| 49 | next | 24.0 | 8 | medium | conversion-trust | Persist custom-order & artwork enquiries as leads (the deferred Phase-2 row) with an admin queue |
| 50 | now | 24.0 | 9 | medium | admin-cms | WhatsApp enquiry counter -- the one metric that matters |
| 51 | later | 24.0 | 8 | low | ux-motion | Sold-ribbon and status-change motion: a considered 'sold' treatment beyond the diagonal band |
| 52 | next | 24.0 | 6 | low | architecture-dx | Central typed env module with @t3-oss/env-nextjs (lib/env.ts) |
| 53 | next | 22.4 | 9 | medium | ecommerce | Persist custom-order briefs as leads (finally build the Phase-2 row the type already promises) |
| 54 | next | 22.4 | 9 | low | admin-cms | Quick-add from phone -- one-tap camera-to-catalog |
| 55 | next | 22.0 | 8 | low | ecommerce | Razorpay Payment Link on the artwork WhatsApp CTA (zero-schema pay path) |
| 56 | next | 22.0 | 8 | low | engagement-retention | 'Recently viewed' rail, client-side, on /work and the detail page |
| 57 | next | 21.6 | 9 | low | admin-cms | Hidden/draft status -- decouple 'work in progress' from price |
| 58 | next | 21.0 | 8 | medium | trust-legal-ops | Tax-inclusive price display with a 5% GST line and HSN 9701 note on priced pieces |
| 59 | next | 21.0 | 7 | low | trust-legal-ops | DPDP-aligned privacy notice + a lightweight, no-vendor cookie/analytics consent bar |
| 60 | next | 21.0 | 8 | low | trust-legal-ops | Data-seam price integrity + sold-out guard so a live-editable catalog never advertises a stale/available-but-unpriced state |

### Idea detail

**1. Set immutable Cache-Control on R2 image uploads** [perf-pwa, now, RICE 360.0, fit 9, low risk, ~0.1wk]

- What: Add `CacheControl: "public, max-age=31536000, immutable"` to the `PutObjectCommand` in lib/storage/r2.ts `uploadObject()`. Every artwork/event/profile variant is content-addressed by slug+width+ext and only ever replaced under a NEW key (replace-image re-runs the pipeline; the master keeps its key but is a rare, deliberate mutation), so the whole variant set is safe to mark immutable. This is the single highest-leverage perf change: repeat WhatsApp/IG visitors and page-to-page navigation stop re-validating every AVIF.
- Why: lib/storage/r2.ts:42 currently sets only ContentType, no CacheControl. Without it, Cloudflare R2 custom-domain responses fall back to short/dynamic caching (confirmed community reports: R2 custom domain returns cf-cache-status DYNAMIC, ~24h default), so the browser and edge re-fetch the same immutable variants. Images are the dominant byte weight of this gallery on low-end Indian phones on slow networks.
- Research: Cloudflare community + docs: R2 objects served via custom domain honor object-metadata Cache-Control; setting `max-age=31536000, immutable` on the object is the recommended way to get long edge+browser caching (community.cloudflare.com/t/how-to-set-r2-cache-control-public, /t/different-cache-control-header-for-r2). Master JPG under a stable key is the only re-write path (process-artwork-image.ts writes `<slug>.jpg`); acceptable because image replacement is a rare admin action and a query-string/cache-purge is available if ever needed.
- Risks: Master JPG replace-image on the same slug could serve a stale master for up to a year at the edge; mitigate by purging that one key on replace, or accept it (variants change key on re-upload anyway). ponytail: one-line header add, no new dep.

**2. scroll-padding-top for the sticky header (WCAG 2.2 2.4.11 Focus Not Obscured)** [a11y, now, RICE 144.0, fit 10, low risk, ~0.1wk]

- What: Add `html { scroll-padding-top: <named token>; }` to globals.css sized to the shrunk header height, plus `scroll-margin-top` on section anchors and the artwork detail plate. Right now the sticky, backdrop-blur, scroll-shrinking header (site-header-client.tsx) sits over the top of the viewport with zero scroll padding (grep confirms 0 occurrences of scroll-padding/scroll-margin in globals.css). When a keyboard or screen-reader user tabs to a link that lands just under the header, or follows the skip-to-content link, or hits the prev/next artwork nav on /work/[slug], the focused element scrolls flush to the top and is partially hidden behind the blurred bar.
- Why: 2.4.11 is a NEW WCAG 2.2 Level AA criterion (w3.org/TR/WCAG22) that a fixed header trivially violates. This is the single highest-value a11y fix here: it is universal (every focusable element below the fold), the fix is a few CSS lines using an existing spacing token (no raw magic value), and it costs nothing at runtime. Fully respects house rules (CSS custom prop, named token, no JS).
- Research: WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum), AA. W3C + Deque both give the exact remedy: html{scroll-padding-top:<header height>} and :focus{scroll-margin-top}. Backward-compatible addition to 2.1.
- Risks: Must match the SHRUNK header height, not the tall resting one, or padding is slightly off; the header shrinks on scroll so the shrunk value is the one in play once scrolling. Reserve a spacing token, do not hardcode px.

**3. Contrast + non-text-contrast audit of the oklch pigment tokens (fix the gold-leaf and vermillion-on-cream pairs)** [a11y, now, RICE 136.0, fit 9, low risk, ~0.3wk]

- What: Do a measured WCAG contrast pass on the semantic + pigment tokens in globals.css against their real backgrounds, in BOTH light and dark. Prime suspects from the values: --color-gold-leaf (L 0.76) and --color-marigold (L 0.72) as TEXT on cream --color-bg (L 0.97) will fail 4.5:1; --color-vermillion text on cream (used for the Available-to-buy chip label at rest, work-filter.tsx line 123 `text-(--color-vermillion)`) and --color-muted (L 0.46) for meta labels are borderline. Also check 1.4.11 non-text contrast on the pill borders (--color-line, L 0.87 on L 0.97 bg = very low, ~1.1:1) which are the only affordance boundary on inactive filter chips. Introduce darker -on-light variants where a pigment must carry text.
- Why: The palette is the domain's explicit focus ('contrast on the oklch palette'). oklch lightness is perceptual, so a designer's eye can be fooled -- the marigold/gold-leaf hues look rich but as small text on cream they are almost certainly sub-AA. The Available-to-buy chip is a conversion-critical control whose resting state is vermillion text on cream; if that fails, the store's own affordance is inaccessible. Fixing via new semantic token variants keeps the raw-hex and CSS-custom-prop rules intact.
- Research: WCAG 1.4.3 Contrast (Minimum) 4.5:1 body / 3:1 large, and 1.4.11 Non-text Contrast 3:1 for UI component boundaries and states (both AA). oklch L is not luminance -- must measure actual ratio (APCA or WCAG2) in-browser, not infer from L. Chrome DevTools + the chrome-devtools skill can read computed contrast per element.
- Risks: Darkening pigments risks dulling the folk-art palette Megha wants vibrant (house rule: keep motion/color expressive) -- so only bump the -on-text variant, leave decorative fills (chromacards, section washes) at full chroma. This is a measurement task first; needs a live browser (no python available in this env) to get real ratios before touching tokens.

**4. Real 1200x630 OG social card via app/opengraph-image** [perf-pwa, now, RICE 128.0, fit 9, low risk, ~0.3wk]

- What: Add `app/opengraph-image.tsx` (Next 16 ImageResponse) generating a proper 1200x630 landscape card -- brand mark + tagline on the paper-grain ground -- replacing the square 1254x1254 /logo.jpg currently used for OG/Twitter. Since nearly all traffic is WhatsApp/IG link-taps, the link-preview thumbnail is effectively the site's front door and a square logo renders as an awkward crop in chat.
- Why: infra-seo recon: OG/Twitter image is the square /logo.jpg -- NOT a 1200x630 card; no app/opengraph-image.* exists (confirmed absent). This is a perf-adjacent conversion lever: a correct card renders instantly from cache in the WhatsApp preview and looks intentional, improving tap-through from the dominant channel.
- Research: Next 16 supports file-based `opengraph-image.tsx` with the `ImageResponse` API (built into next/og) rendering an edge-generated static card at build time -- no runtime cost, cached. 1200x630 (1.91:1) is the WhatsApp/Twitter/FB standard; square images get center-cropped in chat previews. Can reuse the existing paper-grain look and brand fonts (app/fonts.ts).
- Risks: Slight overlap with the SEO domain, but the WhatsApp-preview-as-front-door framing is a performance/conversion concern for this traffic profile. Keep copy house-rule clean (no double-dash, no emoji). One static route, negligible bytes.

**5. Add `pnpm test` gate to CI between typecheck and build** [testing-quality, now, RICE 102.0, fit 9, low risk, ~0.1wk]

- What: Wire the new Vitest run into .github/workflows/ci.yml as a step after `pnpm typecheck` and before `pnpm build` (`- name: Test / run: pnpm test`). Keep the existing least-privilege `contents: read`, 10-min timeout, and frozen-lockfile install. No secrets needed -- pure-fn tests don't touch Neon/R2, so the step runs before the secret-injected build and stays fast.
- Why: A test suite that isn't gated in CI rots -- the recon flagged 'no test step, no coverage, no Lighthouse/a11y gate in CI' as the core gap. The house merge rule is 'see all checks passed if so merge it', so tests must be a check or they won't block a bad merge. Placing it before the build means a broken pure-fn fails in seconds without spinning up the DB-reading build.
- Research: testparty.ai and the ACCESSIBILITY.md CI guide both show the standard pattern: install -> build -> test as discrete gated steps; keeping the fast pure-fn tests off the secret-injected build step is the documented way to fail fast.
- Risks: None material -- it's one YAML step. Only real decision is ordering (before build = fast fail, correct choice). Don't add coverage thresholds yet (YAGNI until there's a suite worth measuring).

**6. Devanagari (Hindi) numerals + rupee symbol in formatInr/formatEventDate, locale-aware** [i18n, next, RICE 96.0, fit 8, low risk, ~0.3wk]

- What: Upgrade the two existing formatters in `lib/utils.ts`. `formatInr` currently emits the ASCII string "INR 12,500"; switch it to `Intl.NumberFormat('en-IN', { style:'currency', currency:'INR' })` so it renders the real ₹ glyph with correct Indian lakh/crore grouping, and take an optional locale so the Hindi view can use `hi-IN-u-nu-deva` for Devanagari digits (१२,५००). Same treatment for `formatEventDate` (localized month names in Hindi). One authoritative formatter, no drift - exactly the file's stated intent.
- Why: The rupee symbol is warmer and more native than the ASCII 'INR' prefix for an India-first audience, and Devanagari numerals reinforce the folk-art identity the brand already leans on. It is the smallest, highest-signal localization win and unblocks the Hindi toggle's price/date display.
- Research: Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}) yields the ₹ symbol with Indian digit grouping 12,34,567.89 (w3.org/International/questions/qa-number-format). Appending the `-u-nu-deva` Unicode extension (`hi-IN-u-nu-deva`) switches the numbering system to Devanagari: new Intl.NumberFormat('hi-IN-u-nu-deva').format(1234) -> १,२३४ (willcodefor.beer/posts/intlu). Both are built into V8/ICU, zero dependency.
- Risks: House rule bans raw hex in components but says nothing against a currency glyph - fine. Keep the WhatsApp message (lib/whatsapp.ts) in ASCII-safe form or verify ₹/Devanagari survive URL-encoding into wa.me deep links (they do, but test on the in-app Instagram browser). Budget presets in site.json already hardcode '₹' as text - align those or leave them (they are user-editable copy, not formatter output).

**7. 1200x630 branded social share cards (dynamic OG images) via Next ImageResponse** [content-story, now, RICE 86.4, fit 9, low risk, ~0.5wk]

- What: Add app/opengraph-image.tsx (root) and a per-artwork opengraph-image for /work/[slug] using Next 16's ImageResponse to compose a real 1200x630 card: the piece image + title + style + 'Kalचर by Megha' wordmark, rendered at build time (force-static, matching the site). Replaces the current square 1254x1254 logo.jpg that the recent changelog admits is used as the default OG image for every route.
- Why: Every share of a story -- a journal post, a heritage page, an artwork -- lands in WhatsApp/Instagram, the site's dominant traffic source. Right now those previews are a text card with a square logo (infra-seo recon: no 1200x630 card, no app/opengraph-image.*). A proper landscape card with the actual artwork is what makes a shared link look like a gallery instead of a link-dump, directly amplifying the reach of all the storytelling content above. This is the multiplier that makes the journal/heritage work actually spread.
- Research: Next.js 16 supports file-based opengraph-image with ImageResponse (Satori) rendered statically; en_IN locale + summary_large_image are already set in layout.tsx, so the card just needs correct dimensions to render large. This is the documented, zero-runtime-cost way to do it on Vercel.
- Risks: ImageResponse needs a bundled font for the Devanagari 'चर' mark -- either ship a subset .woff or render the wordmark in Latin only to avoid tofu (test on-device). Keep it force-static so it costs nothing at request time (budget-conscious). No raw hex in the JSX -- but ImageResponse can't read CSS vars, so define the palette as named JS constants with a comment (ponytail: literals justified here, mirror globals.css).

**8. Per-artwork dynamic OG card via opengraph-image.tsx** [seo, next, RICE 75.6, fit 8, medium risk, ~0.5wk]

- What: Add app/work/[slug]/opengraph-image.tsx that returns an ImageResponse -- a 1200x630 branded social card composing the artwork image (fetched from R2) beside title + style + price, on the paper-grain cream background. Because slug is a route param (not a search param), the file-convention approach works and inherits generateStaticParams, so all 21 cards bake at build. Replaces today's raw-webp OG image (which is the piece at its native 3:4 ratio, letterboxed awkwardly in a 1.91:1 social slot).
- Why: 1.24.2 hardened the artwork OG image to carry real dimensions, but it's still the bare artwork webp at the piece's own aspect ratio -- WhatsApp/Instagram/Facebook crop or letterbox a 3:4 image badly in their 1.91:1 preview slot. Since virtually all traffic is WhatsApp/Instagram link-taps, the share-preview card IS the first impression. A purpose-built 1200x630 card with title+price framed correctly converts taps.
- Research: Next 16.1 + @vercel/og 0.6 file convention: opengraph-image.tsx alongside a route auto-wires og:image meta and supports generateStaticParams for SSG (makerkit.dev, Jan 2026). Known constraint (Reddit/Medium 2026): opengraph-image.tsx canNOT read searchParams -- but this route uses a path param, so it's the recommended case, not the API-route fallback.
- Risks: ImageResponse fonts must be self-hosted/loaded (fontDisplay/fontDevanagari are already local in app/fonts). Fetching the R2 master into the edge renderer adds build time across 21 pages -- acceptable at SSG. Keep the card under the 500-line file ceiling (it will be ~80 lines). No emojis in the card copy.

**9. Add conversion CTAs to the two storytelling dead-ends (/events and /about)** [content-story, now, RICE 75.0, fit 9, low risk, ~0.15wk]

- What: Append a lightweight closing CTA card to /events ('Want a workshop like these for your group / school?' → WhatsApp group enquiry, the deep-link that already exists on /workshops) and to /about ('Commission a piece' → /custom-orders, reusing the about.asideBody 'Open to' copy). Pure component reuse -- Card + buttonVariants + existing whatsapp.ts builders; no new data.
- Why: The ux recon flags both pages as conversion dead-ends: /events is social proof with zero CTA, /about ends on a Devanagari sign-off. These are the pages where a visitor is MOST warmed up by story, and they're the only content pages that don't route anywhere. This is the cheapest storytelling→conversion win on the whole site: story pages should end with a next step, and every other page already does.
- Research: Standard funnel practice + the site's own pattern: every catalog/teaser section already terminates in a WhatsApp or route CTA; these two lag. No external research needed -- it's an internal consistency fix.
- Risks: Keep it subtle -- don't turn an editorial page into a hard sell (respect the quiet tone; a single restrained card). Don't remove the existing footer/sign-off content. Watch the in-app-browser popup fragility noted in recon: use a plain deep-link <a target=_blank>, matching the workshop links. Trivial enough it may not warrant a standalone PR -- bundle with a related content PR.

**10. Editable Trust page: shipping, returns, care & authenticity FAQ (data/site.json + one route)** [conversion-trust, now, RICE 74.7, fit 9, low risk, ~0.6wk]

- What: Add a single /trust (or /faq) route rendering shipping-from-India, returns/exchange stance, packaging, art-care, and 'how buying works over WhatsApp' as an accordion, sourced from a new `trust` block in data/site.json (read via the sync getSite()) so the maintainer edits copy without a deploy. Link it from the footer 'Explore' column and from the reassurance line already on /custom-orders. Add FAQPage JSON-LD from the same content.
- Why: Recon confirms NO shipping/returns/FAQ/legal pages at all -- the biggest unanswered-objection gap for a stranger deciding whether to WhatsApp. Culturati and Indiahandmade both centre FAQ/shipping/returns as the buyer-objection surface for Indian handmade art. Putting it in site.json (not the DB) matches how brand/nav/section copy already lives there, so it's copy-editable and needs no schema change.
- Research: Culturati.in/pages/faqs and Indiahandmade.com/faq show the standard Indian-handmade FAQ scope (shipping, returns, RTO, product care, customisation); Artsy Shark objection guide lists a clear return/exchange policy as a top pre-sale reassurance.
- Risks: Keep it genuinely accurate to a solo India-based seller (real timelines, honest returns stance) -- do not copy generic marketplace policies. Accordion animation must respect prefers-reduced-motion and use named timing tokens, not magic ms.

**11. "Explore this style" cross-links wired through getStyleSamples()** [personalization, now, RICE 74.4, fit 9, low risk, ~0.4wk]

- What: On each artwork detail page and in the lightbox, add a single tappable chip "See more <style>" that deep-links to the style-filtered gallery (using the URL-param lens from idea #3, or today's #work). Also add the same chip to the home Hero's existing static style chips so they navigate to the filtered view instead of being decorative.
- Why: getStyleSamples() already builds a style->representative-artwork map but is only consumed by the custom-order picker. The style facet is the most legible "browse by" axis for folk art (Madhubani vs Gond are visually distinct traditions), yet from a piece's detail page there is no one-tap way to see its siblings. This is the cheapest style-based-browse win and reuses existing derivation.
- Research: Pairs with idea #3's URL-param lens so the chip target is a real shareable link (/work/?style=Gond). Next Link prefetch makes the style hop instant on mobile. No external research required.
- Risks: Trivial; main care is that the chip target matches whatever filter mechanism ships (hash #work today vs query param after #3) -- sequence after #3 if going the URL route, otherwise ship against the current hash nav immediately. Keep copy free of the banned double-dash and emojis.

**12. app/manifest.ts + basic PWA install so returning WhatsApp/IG visitors can add-to-home** [content-story, now, RICE 70.0, fit 9, low risk, ~0.3wk]

- What: Add a Web App Manifest (name, short_name, icons from the existing logo assets, theme_color mirroring the THEME_COLOR_LIGHT/DARK literals already in layout.tsx, display standalone, start_url /). No service worker / offline caching in v1 -- just installability + a proper home-screen identity. This is a content-reach enabler: it makes the portfolio feel like an app the artist can tell followers to 'add to home screen'.
- Why: The audience is overwhelmingly repeat mobile visitors arriving from Megha's own Instagram/WhatsApp bio links. A manifest lets her say 'add Kalchar to your home screen' -- a zero-friction re-engagement channel for a solo artist with no newsletter/email. infra-seo recon confirms no manifest exists. It's the smallest step toward the 'return visit' story without building the newsletter/email machinery the brief rules out for now.
- Research: Next 16 supports app/manifest.ts (MetadataRoute.Manifest) generated statically; a manifest without a service worker is fully valid and gives installability + correct theme/splash on Android/iOS. Lighthouse PWA + a11y both reward it. Cheap, no vendor lock-in (fits budget-conscious constraint).
- Risks: Don't overreach into offline/service-worker caching now (the brief lists PWA/offline as deliberately absent; ship only the manifest, note SW as the add-when-needed follow-up). Reuse existing icons -- don't generate a new icon set unless maskable-icon linting demands it. Keep theme colors in sync with globals.css (the layout.tsx comment already flags this coupling).

**13. Dark-mode refinement pass: pigment luminance + shadow tuning for OLED phones** [ux-motion, next, RICE 68.0, fit 9, low risk, ~0.5wk]

- What: Audit the dark remaps: shadows (shadow-lg/xl on hero plates and cards) are near-invisible on the dark bg, and `ring-black/8` on cards flips to `ring-white/8` but the plates keep `ring-black/5`. Introduce a `--elevation` token pair (light/dark) and a subtle inner-glow or pigment-tinted ring for dark mode so cards read as elevated plates rather than flat rectangles; verify each pigment's dark oklch value has enough chroma against the very dark `--color-bg` (0.14 L). Add a one-shot theme-toggle crossfade using the existing page-enter opacity technique.
- Why: Most traffic is mobile, many on OLED where the current dark mode loses all depth cues (shadows vanish, plates flatten). This is polish that directly affects the dominant device class, and it's grounded in specific token gaps rather than a vibe.
- Risks: Don't over-brighten -- the atelier register wants quiet chrome. House rule: no raw hex, so elevation must be tokenised. Theme crossfade must reuse the opacity-only page-enter approach (globals.css documents that transform on that wrapper breaks fixed positioning).

**14. Honest scarcity microcopy on single-original pieces (no timers, no fake stock)** [conversion-trust, now, RICE 67.2, fit 9, low risk, ~0.25wk]

- What: On available priced pieces, add a small, tasteful 'One of a kind -- the only original' line near the price on /work/[slug] and in the lightbox metadata sidebar, plus a subtle 'Original, not a print' badge. Drive it purely off the existing fact that each artwork is a single physical piece (status available + priceInr set). No countdowns, no invented 'X people viewing', no stock counts.
- Why: Genuine scarcity is the strongest ethical urgency lever for original art (RedDotBlog, Artsy Shark) and kalchar's data model already guarantees it -- each piece is unique, sold flips it out of the store. Making that uniqueness explicit converts the browser who assumes prints are available. It's copy, not mechanism, so it can't drift into dark-pattern territory.
- Research: theprintspace and Artsy Shark both stress that authentic scarcity (true one-of-a-kind originals) drives immediate action, while RedDotBlog warns fabricated scarcity backfires; the ethical framing is 'state the real constraint, add no artificial one'.
- Risks: Must NOT add countdown timers or fake viewer counts (dark patterns, and no data to back them). Copy respects no-double-dash rule -- use commas or 'the only original' phrasing, and no emoji badges.

**15. UPI QR + amount on the receipt/enquiry for buyers who won't tap a link** [payments-ops, now, RICE 63.0, fit 9, low risk, ~0.5wk]

- What: Render a static UPI intent QR (upi://pay?pa=<vpa>&pn=<name>&am=<priceInr>&tn=<slug>) next to the WhatsApp CTA, generated purely client-side from a maintainer-set UPI VPA in settings. Buyer scans with any UPI app and the amount + note are pre-filled. Pairs with a 'I've paid, here's the ref' WhatsApp prefill. This is the zero-fee, zero-gateway fallback for the many buyers who distrust payment links from an unknown site.
- Why: India's WhatsApp/IG buyers overwhelmingly pay by direct UPI to a known person, not by tapping a gateway link on an unfamiliar site -- and direct UPI has no 2% cut. A UPI intent QR is a pure-string deep link (same philosophy as lib/whatsapp.ts's wa.me builder) with no gateway, no account onboarding, no webhook. It's the laziest possible 'accept money' feature and complements, not replaces, idea #1.
- Research: UPI deep-link spec: upi://pay?pa=&pn=&am=&cu=INR&tn= is honored by all UPI apps (PhonePe/GPay/Paytm). Razorpay's own docs push UPI as the zero-MDR rail (UPI stays at 0% TDR even in their pricing). No settlement account needed -- money lands directly in the artist's bank.
- Risks: No automatic payment confirmation (no webhook) -- reconciliation is manual via the WhatsApp 'here's my ref' step, which is fine at this volume. Validate the VPA format at build time like assertValidPhone does for phone numbers. Don't hardcode the VPA -- settings only.

**16. WhatsApp enquiry hardening: popup-safe links + copy-message fallback across all CTAs** [conversion-trust, next, RICE 63.0, fit 9, low risk, ~0.4wk]

- What: Extract the custom-order form's popup-blocked mailto-fallback logic into a shared client helper and apply it to the per-artwork and per-workshop enquiry CTAs (today plain <a target=_blank> that rely on the browser honoring the deep-link). On click, attempt the WhatsApp link; if window.open is blocked, surface a 'copy message' button + the wa.me link inline so an Instagram/WhatsApp in-app-browser visitor can still complete the enquiry.
- Why: Recon flags the per-artwork and workshop enquiry links as fragile: from in-app IG/WhatsApp browsers (the dominant traffic) the deep-link can silently fail with no fallback, unlike the custom-order form which already handles it. Every silently-dropped tap is a lost enquiry -- the exact enquiry-to-sale metric this domain targets. Unifying the fallback is a trust+conversion fix, not a new feature.
- Research: Recon's own 'popup-blocker fragility' note; general mobile-web behavior where in-app webviews block programmatic window.open -- a documented failure mode for wa.me deep-links from social in-app browsers.
- Risks: The detail-page CTA is a server-rendered <a>; adding fallback needs a small client island (or native <a> stays as the default and the island enhances it). Keep the link as the progressive-enhancement base so no-JS still works.

**17. Per-piece 'Share' button with native Web Share + copy-link fallback** [social, next, RICE 63.0, fit 9, low risk, ~0.4wk]

- What: A small client island on /work/[slug] and inside the lightbox: a Share icon-button that calls navigator.share({ title, text, url }) when available (the dominant mobile case), falling back to navigator.clipboard.writeText(url) with a transient 'Link copied' badge (reuse the admin 'Saved.' pattern). The shared URL is the trailing-slash canonical /work/<slug>/, which -- once the Product Rich Pin tags above ship -- unfurls with image, title, and price in WhatsApp/IG DMs.
- Why: Right now the ONLY outbound social action a visitor can take is enquiring; there is no way to send a specific piece to a friend or a group chat, which is exactly how art spreads on WhatsApp. Web Share API is native, free, needs no SDK, and on mobile opens the real OS share sheet (WhatsApp, IG DM, etc.). It pairs with the OG/rich-pin work so the shared link looks good, not like a bare URL.
- Research: navigator.share is supported across iOS Safari and Android Chrome (the whole target audience per layout viewport/en_IN + WhatsApp/IG traffic). It must be called from a user gesture and only over HTTPS (Vercel prod is HTTPS). Fallback to Clipboard API covers desktop. No dependency required -- both are platform APIs (ladder rung 4).
- Risks: Must respect prefers-reduced-motion on the badge (repo rule). Feature-detect navigator.share before showing the sheet path. Keep the button subtle (rounded-md, CSS custom props only, no raw hex) and add an aria-label. No emoji in the 'Link copied' copy.

**18. First-party enquiry-event log (enquiry_events Drizzle table + /go/wa redirect handler)** [analytics, next, RICE 63.0, fit 8, medium risk, ~0.5wk]

- What: Add an 8th table enquiry_events (id, kind: 'artwork'|'custom'|'workshop'|'contact', slug nullable, source: 'card'|'lightbox'|'detail'|'teaser'|'workshop'|'contact', createdAt, sessionHash nullable). Replace the bare wa.me <a target=_blank> links (artwork-card via lightbox CTA, artwork-lightbox.tsx:337, app/work/[slug]/page.tsx:231, workshops:69, custom-orders-teaser:79, contact) with a route handler GET /go/wa?to=<slug>&src=<source> that INSERTs one row then 307-redirects to the real wa.me deep link built by buildWhatsAppLink. Every enquiry tap becomes one durable row in Neon -- the data that literally does not exist today.
- Why: This is THE foundational gap: every buy/enquiry funnels to a plain external <a>, so the site captures zero signal about what drives interest. Vercel custom track() is Pro/Enterprise-only (Hobby = pageviews only) so it can't fill this on the free plan. A redirect handler is the one place ALL nine enquiry paths converge (the whatsapp.ts seam already centralizes link-building), so it's the lazy root-cause spot -- instrument once, not per-CTA. Neon+Drizzle+server-actions plumbing already exists; this is a table + one 20-line handler.
- Research: Vercel Web Analytics pricing (vercel.com/docs/analytics/limits-and-pricing): custom events are Pro/Enterprise only; Hobby is 50K pageview events, NO custom events -- confirms first-party is the budget path. Next.js redirect() in Route Handlers returns 307 (nextjs.org/docs/app/guides/redirecting) -- clean deep-link forward after the insert. Cookieless sessionHash (daily-salted IP+UA hash) keeps it GDPR-safe, no consent banner (Plausible/Umami model).
- Risks: In-app IG/WhatsApp browsers may mangle a two-hop redirect (the custom-order form already handles popup-block with a mailto fallback) -- must verify the deep-link still fires from those webviews before shipping. Keep sessionHash non-reversible (no raw IP stored) to respect privacy-first. Route handler is dynamic, so it can't be statically exported -- fine on Vercel, but note the deploy.yml Pages fallback would break it (that fallback is already dormant).

**19. Meta Commerce catalog CSV data feed at /catalog.csv** [social, now, RICE 61.3, fit 9, low risk, ~0.4wk]

- What: A static Next route (app/catalog.csv/route.ts, force-static) that renders every available artwork as a Meta Commerce Manager data-feed row: id (slug), title, description, availability (in stock/out of stock from status), condition, price ('1500 INR'), link (https://kalchar.co.in/work/<slug>/), image_link (the R2 1200.webp variant via ARTWORK_IMAGE_BASE), brand. Megha points Commerce Manager at the URL once and picks a daily/weekly auto-sync cadence; the WhatsApp catalogue (contact.whatsapp.whatsapp.catalog, already wired in /work and /contact) then stays current with zero manual re-entry. Reads getAvailableArtworks() through the data seam.
- Why: The 'Shop on WhatsApp' catalogue button already exists but the catalogue is hand-maintained in the WhatsApp Business app, so it drifts from the site the moment a piece sells or a price changes. Meta feeds explicitly accept a CSV/TSV/XML URL with scheduled sync (confirmed: Interakt, yellow.ai, Meta docs). This turns the Neon catalog into the single source for both the website AND the WhatsApp storefront for free, and every product then also gets a wa.me/c/ deep card. Most traffic is WhatsApp/IG, so a fresh in-chat catalogue is the highest-leverage social surface.
- Research: Meta Commerce Manager data feed accepts a CSV/TSV/XML file at a URL with hourly/daily/weekly auto-sync (yellow.ai docs 'Download template... enter the URL... automate the sync'; Interakt 'Data Feed Upload: CSV, TSV, XML, or JSON'). Required feed columns: id, title, description, availability, condition, price, link, image_link. Meta catalog underpins Single/Multi-product WhatsApp messages (developers.facebook.com catalogs-overview). No paid BSP needed for a feed-URL sync.
- Risks: Feed must use absolute R2 image URLs + trailing-slash product links (next.config trailingSlash:true already matches). INR price format must be '<amount> INR'. Domain the catalog reads only availability='available'; sold pieces should emit availability='out of stock' or be omitted, decide with Megha. No house-rule conflict.

**20. Watercolor/pigment wash backdrops per section using layered CSS gradients (no images)** [ux-motion, next, RICE 59.5, fit 9, low risk, ~0.3wk]

- What: Create a `PigmentWash` decorative layer: 2-3 large, blurred radial-gradient blobs in the section's `--section-accent` at very low alpha (color-mix with transparent), absolutely positioned behind content, `aria-hidden`, `pointer-events-none`. The footer already does exactly this ('Soft pigment washes for warmth -- one top-left, one bottom-right'), so this generalises that footer pattern into a reusable component for the home hero, /about, and empty states. Optionally add an ultra-slow (20s+) hue/position drift gated behind no-preference reduced-motion.
- Why: Gives each section a faint hand-mixed-pigment ground that matches the folk-art register far better than flat `--color-bg-soft`, and because it's pure gradients it costs nothing in payload (budget-conscious, mobile-friendly). Reuses a pattern the maintainer already shipped in the footer, so it's consistent, not novel risk.
- Risks: Keep alpha very low so text contrast (a11y) is untouched -- verify against ink/muted tokens. Drift animation must be reduced-motion-gated and slow enough not to distract; default could be static wash with drift as enhancement.

**21. /api/health route + external heartbeat (UptimeRobot free / Healthchecks.io)** [observability, next, RICE 57.6, fit 8, low risk, ~0.25wk]

- What: Add a lightweight app/api/health/route.ts (force-dynamic, no-cache) that does a trivial `select 1` through the data seam and a HEAD on one known R2 public object, returning {db:'ok',r2:'ok'} 200 or 503 with which dependency failed. Register the URL as a 5-minute HTTP monitor on UptimeRobot's free tier (50 monitors) with keyword assertion on 'ok'. This catches the failure modes that a homepage 200 hides: Neon cold-start/credential expiry and R2 serving 403s.
- Why: infra-seo recon: no uptime monitoring at all; the catalog seam reads Neon + R2 at request/build time, so a DB outage or rotated R2 key silently breaks the gallery while a cached static page may still return 200. A solo India-based maintainer needs a phone push when the site is actually down, not a customer WhatsApp complaint.
- Research: UptimeRobot free: 50 monitors, 5-min checks, keyword/HTTP/SSL, email+mobile-push+16 integrations, non-commercial (uptimerobot.com 2026). Healthchecks.io: 20 free checks, open-source/self-hostable. A '200 OK does not mean the app works' - keyword assertion on the dependency JSON is the fix (onlineornot 2026). SSL-expiry monitoring on the same tool covers kalchar.co.in cert.
- Risks: A public /health that touches the DB is a tiny DoS surface - keep the query trivial and consider a shared-secret query param if abused. Don't let the R2 HEAD count against R2 request quotas meaningfully (5-min interval is fine). ponytail: db-only check is enough for v1; add R2 when a rotated-key incident actually happens.

**22. Structured shipping & care copy blocks reused on artwork detail + custom-orders (single source in site.json)** [trust-legal-ops, next, RICE 52.5, fit 9, low risk, ~0.4wk]

- What: Add a `shipping` and `care` object to site.json (e.g. ships-from-India, courier partner, rolled-vs-framed, insured/tracked, lead time, international-on-request) and a small `<PolicyNote>` component that renders a collapsible 'Shipping, care & handling' disclosure. Reuse it on the artwork detail page (near the CTA), on the custom-orders page (which today only has prose 'Ships from India after your sign-off'), and as the body of the shipping-returns legal page from idea #1. One data source, three render sites -- no duplication.
- Why: Buyers of a physical original need to know it ships insured/rolled, care instructions (folk art on paper/canvas/mud-relief Lippan has real handling constraints), and international-shipping availability BEFORE they enquire -- reducing back-and-forth on WhatsApp. Custom-orders currently defers all of this to a WhatsApp conversation; surfacing it up front is a conversion + trust win and satisfies the E-Commerce Rules' shipping-disclosure expectation.
- Research: E-Commerce Rules require disclosure of shipping cost/terms and total price breakdown before purchase (Paradigm Press analysis; Synergia playbook). Lippan (mud-relief + mirrors) and paper-based Madhubani have distinct care needs -- care copy is genuinely per-medium, so the component should accept medium-aware text rather than one blanket paragraph.
- Risks: Keep the disclosure collapsed on mobile so it doesn't push the CTA below the fold. Don't invent shipping terms -- get Shiprocket/India Post/courier specifics from the artist. Care text must be accurate per medium, not generic.

**23. VisualArtwork JSON-LD on /work/[slug]** [seo, next, RICE 52.0, fit 9, low risk, ~0.3wk]

- What: Emit a per-piece schema.org VisualArtwork (nested inside CreativeWork) JSON-LD block on each artwork detail page. Map fields the data model already has: name=title, image=the 1200 webp OG URL, artMedium=medium, artform/artworkSurface from medium string, dateCreated=year, artist={Person, reuse the layout.tsx block}, width/height from dimensions+aspectRatio, and for priced pieces an nested Offer (priceCurrency INR, price=priceInr, availability=InStock when status==='available', SoldOut when 'sold'). Add it in generateMetadata's sibling: a small <script type=application/ld+json> in the page body, exactly the pattern layout.tsx already uses.
- Why: The site's ONLY structured data today is a single Person block that layout.tsx stamps on every page (including all 21 SSG artwork routes) -- artwork pages carry zero item-level markup. VisualArtwork is the canonical type for paintings and, with an Offer, is what makes a priced piece eligible for product/price rich results in Google Images and Search. Highest-leverage grounded win: the data (title, medium, priceInr, status, dimensions, aspectRatio, year) is all already loaded on the page.
- Research: schema.org/VisualArtwork is the canonical type for paintings (artMedium, artworkSurface, artist:Person, width/height). Google's product/merchant rich results read a nested Offer with priceCurrency/price/availability (schema.org Offer availability tokens: InStock/SoldOut/OutOfStock). VisualArtwork itself has no dedicated Google rich-result card, so wrap or pair with Offer to earn the price snippet.
- Risks: House rule: no literal double-dash in user-facing copy -- JSON-LD isn't rendered copy but keep description clean anyway. availability must map status honestly (sold->SoldOut) or it's a spam signal. Don't invent artEdition (each piece is a 1-of-1 original, so omit or set to 1).

**24. Gold-leaf shimmer sweep on 'Available' badges and primary WhatsApp CTAs** [ux-motion, next, RICE 52.0, fit 9, low risk, ~0.4wk]

- What: Add a reusable `.gold-shimmer` utility: a slow, low-opacity diagonal highlight sweep (reusing the existing skeleton-sweep keyframe technique and `--color-gold-leaf`) that plays once on the Available badge when a card enters view and subtly loops on the single primary 'Enquire on WhatsApp' CTA on the artwork detail / lightbox. Duration from a named token (`--duration-slow`), respects reduced-motion by resting static (exactly like `.skeleton::after`).
- Why: The buy path is the whole commerce model (every sale is a WhatsApp deep-link), yet the conversion CTA is visually quiet. A restrained gold-leaf shimmer draws the eye to the one action that matters without adding a second CTA or louder color -- it dresses the existing button, matching the atelier register.
- Risks: Must be subtle and infrequent (once on enter, or a very slow loop) or it reads as spam -- flag: gild the CTA, don't animate it constantly. No emojis/hex rules unaffected (token-only).

**25. Lightbox neighbor prefetch on hover/focus** [perf-pwa, next, RICE 48.0, fit 9, low risk, ~0.2wk]

- What: In the lightbox (and prev/next detail nav), prefetch the AVIF srcset of the immediately-adjacent artwork(s) when the current one settles, using a `<link rel=prefetch>` or a warm `new Image()` at low priority. Sweeping the archive with arrow keys / swipe then shows the next plate near-instantly instead of a fresh cold fetch.
- Why: artwork-lightbox.tsx already supports arrow-key + touch-swipe navigation and ResponsiveImage resets state per keyBase, so users flip fast -- but each neighbor is fetched only on arrival. artworkPreloadSrcset() already exists in lib/image-base.ts to build the exact AVIF srcset; reuse it for the neighbor, no new machinery.
- Research: Existing lib/image-base.ts `artworkPreloadSrcset(image, maxWidth)` is built for LCP preload and is directly reusable for neighbor prefetch. Respect the reduced-motion / data-saver spirit: gate prefetch behind `navigator.connection?.saveData !== true` so 2G/data-saver users aren't charged for speculative bytes.
- Risks: Speculative bytes on metered connections -- gate on Save-Data. Keep it one neighbor each side, not the whole gallery. ponytail: reuse existing srcset helper, ~15 lines.

**26. AVIF encode-quality/effort A-B pass for smaller gallery bytes** [perf-pwa, next, RICE 47.3, fit 9, low risk, ~0.4wk]

- What: Re-tune the sharp AVIF options (currently quality:60, effort:4) -- test effort:6-9 (slower encode, smaller files, one-time admin cost) and a quality sweep 50-58 with SSIM/eyeball check on a Madhubani + a Pichwai (fine linework vs. flat color behave differently). Add a small script to re-encode existing masters at the chosen setting. Every KB shaved off the AVIF is a KB not downloaded on a 4G-throttled phone.
- Why: process-artwork-image.ts hardcodes AVIF_OPTS={quality:60,effort:4}. effort:4 is a mid setting chosen for admin upload speed, but encode time doesn't matter for a solo artist uploading a few pieces a week -- raising effort trades admin seconds for permanent visitor bytes. quality:60 may be higher than needed for AVIF on flat-color folk art.
- Research: sharp/libavif: `effort` (0-9) trades encode time for compression ratio with no quality loss; effort 6-9 typically yields meaningfully smaller AVIF for the same quality. AVIF at q50-55 is often visually lossless for illustration/flat-color art (unlike photos). Validate per-style because Madhubani's dense linework is detail-sensitive; keep a re-encode script (pattern already exists: scripts/migrate-images-to-r2.ts).
- Risks: Art-image integrity: must not visibly degrade linework -- gate the chosen quality behind a side-by-side check on the most detail-heavy style. Higher effort slows admin upload (acceptable per low upload frequency). ponytail: tuning knobs + one re-encode script, not new architecture.

**27. LocalBusiness / geo signals for India-based artist discoverability** [seo, next, RICE 45.0, fit 8, low risk, ~0.1wk]

- What: Add a lightweight structured-data + on-page local signal: extend the existing Person JSON-LD (or add a sibling ProfessionalService/LocalBusiness) with address (addressCountry: IN, addressRegion, addressLocality if the artist is comfortable), areaServed India, and knowsLanguage [en, hi]. Keep it to city/region granularity (no street address for a solo home-based artist). Reflect the same location string already shown in the footer/about location card.
- Why: The footer and /about already display a location ('brand/tagline/location'), and copy repeatedly says 'ships from India' -- but no machine-readable geo/areaServed exists. For an India-based artist whose buyers search 'Madhubani artist near me / in [city]', a geo signal + areaServed materially helps local/regional ranking without any new pages. Cheap, on-brand, budget-friendly.
- Research: schema.org Person supports address (PostalAddress), knowsLanguage, and can be linked to a LocalBusiness/ProfessionalService for service-area businesses. Google 'service-area business' guidance: region-level areaServed is valid without a physical storefront address -- appropriate for a home studio.
- Risks: PII/safety: a solo home-based female artist may not want a precise address exposed -- cap at city/region and confirm with the maintainer before publishing (house-rule-adjacent: don't leak PII). Don't fabricate a locality; only assert what /about already shows.

**28. Per-style pigment theming via a style→pigment token map** [ux-motion, next, RICE 44.6, fit 8, low risk, ~0.4wk]

- What: Right now Section takes a hardcoded `accent` prop (marigold/pichwai/vermillion/peacock/ruby/accent) chosen by hand per page. Categories are DB-driven free text (artworks.style), so there is no link between a piece's style and any pigment. Add a small `lib/style-pigment.ts` map (Madhubani→vermillion, Pichwai→pichwai, Lippan→gold-leaf, Gond→peacock, etc.) that resolves an artwork's `style` to one of the EXISTING `--color-*` tokens, then set `--section-accent` on the artwork detail page, the lightbox sidebar, and each `/work` card wrapper. The gold hover-border and title hover-color on ArtworkCard already read `--section-accent`/`gold-leaf`, so each piece's card would glow in its own tradition's pigment on hover with zero new colors introduced. Fallback to `--color-accent` for unmapped/new styles.
- Why: Turns the flat single-accent gallery into a subtly polychrome one that mirrors the actual folk traditions Megha works in, reinforcing the Madhubani-pigment design story already stated in globals.css. It's the single highest-leverage theming win because the plumbing (`--section-accent`, ACCENT_MAP, the card's group-hover reads) already exists -- this just feeds it the right value.
- Risks: Category names are editable free text, so the map must key case-insensitively and degrade to `--color-accent` for renamed/new categories -- never leave a card themeless. House rule: CSS custom props only, no raw hex -- satisfied since it only reuses existing tokens.

**29. Persist the custom-order draft in localStorage so a blocked WhatsApp popup isn't lost work** [engagement-retention, later, RICE 44.0, fit 7, medium risk, ~0.2wk]

- What: Auto-save the custom-order form fields (brief, style, size, budget, timeline, name) to localStorage on change, and rehydrate on mount. If the visitor comes back -- or the in-app Instagram/WhatsApp browser blocked window.open -- their brief is still there instead of a blank form. Add a subtle 'Draft saved' line and a 'Clear' control. ~30 lines around the existing useState in custom-order-form.tsx.
- Why: The form itself already documents popup-blocker fragility (window.open returns null in Instagram's in-app browser, which is the dominant traffic source) and only offers a mailto fallback -- but if the user navigates away first, the whole brief is gone. A long free-text brief is the highest-friction thing a visitor produces on the site; losing it is the worst retention outcome.
- Research: Meta's opt-in + in-app-browser reality (developers.facebook.com opt-in docs; multiple 2026 BSP writeups) reinforces that Instagram/WhatsApp in-app browsers routinely block window.open -- the form's own comment already says so -- so guarding the draft against loss is a real, not speculative, failure mode.
- Risks: Brief text may be personal; clear it on successful send and expose an explicit Clear button. Don't persist across long spans -- a short TTL or clear-on-submit keeps stale drafts from confusing a later visit. ponytail: no library, just JSON.stringify + a debounced effect.

**30. Persist custom-order briefs as leads (finish the Phase-2 seam)** [marketing-growth, now, RICE 38.4, fit 9, medium risk, ~1wk]

- What: Add a leads table (Drizzle) and store every custom-order submission BEFORE opening WhatsApp/mailto. The CustomOrderDraft type (lib/types.ts:167) already exists and its docstring literally says 'Phase 2 stores it as a row and adds an admin queue' - this idea ships exactly that. New server action writes name/style/size/budget/timeline/brief + createdAt + a source tag, then the existing custom-order-form.tsx onSubmit still builds the WhatsApp deep-link as it does today (so no funnel regression). Add a minimal /admin/leads list (mirror the existing events-manager list pattern) with status new/contacted/closed. The WhatsApp popup can be blocked in IG/WhatsApp in-app browsers (form already knows this) - persisting first means a blocked popup no longer loses the lead.
- Why: Today NOTHING is captured: a blocked popup = a lost enquiry, and the dominant traffic is exactly the in-app browsers where popups get blocked. This is the single highest-leverage gap - it turns the site's main conversion path from fire-and-forget into a recoverable lead pipeline, and the type + docstring already promised it. Solo-dev friendly: reuses requireMaintainer, nextOrderSql-style patterns, useServerSyncedList, confirm-dialog.
- Research: Next.js 16 server actions are public POST endpoints with zero built-in auth (nextjs.org serverActions docs, makerkit.dev) - so the write action MUST run Zod validation + a honeypot + IP rate-limit (5 req/10min pattern from arcjet blog) before insert. React 19 useActionState gives the pending/error UI for free. No new dependency needed - Zod-lite hand-validation or the app's existing formString parsing suffices for a 6-field form.
- Risks: Server action is a public endpoint - needs honeypot + rate-limit or it becomes a spam sink. Storing PII (name) means a one-line privacy note near the form and eventual delete-lead action. Keep the file under the 500-line ceiling by splitting lead-actions.ts like event-actions.ts was split.

**31. Server-side 'reserve' state to stop double-selling during a live enquiry** [ecommerce, next, RICE 37.8, fit 9, low risk, ~0.5wk]

- What: Add a fourth artwork status value 'reserved' (extend the existing archive|available|sold union and deriveStatus) plus an admin one-tap 'Reserve' button on the artwork row with an optional auto-expiry note. Reserved pieces show a 'Reserved' badge (styled like the Sold ribbon, distinct token) and drop out of the 'Available to buy' filter, exactly as sold does. When an enquiry goes cold, one tap returns it to available.
- Why: The soft-store's real-world gap: buyer A is negotiating on WhatsApp while buyer B taps buy on the same original. There is no way today to say 'hold, someone's in talks' short of marking it sold (which kills discovery). A reserved lens is a two-line status extension that fixes the only inventory hazard for one-of-a-kind pieces.
- Research: One-of-a-kind inventory has no stock count, only a status flag (data-model snapshot: 'no stock counts, no reservations, no variants'); a status value is the minimum reservation primitive. Etsy/gallery convention uses a temporary 'reserved' listing state for exactly this negotiation window.
- Risks: Manual expiry only (no cron) - a solo maintainer must remember to release stale reserves; add the auto-expiry as a plain note, not a scheduler (ponytail: cron only if it actually gets forgotten). Badge must not crop or distort the artwork image (integrity rule); style with existing CSS custom props, no raw hex.

**32. Testimonials as a first-class catalog entity (testimonials table + data seam + home/detail surfacing)** [conversion-trust, now, RICE 36.8, fit 9, low risk, ~1.2wk]

- What: Add a `testimonials` pgTable (id, quote, authorName, authorLocation nullable, artworkSlug nullable soft-link like artworks.style, order, featured, createdAt) with matching admin CRUD mirroring the workshops/presets managers, a `getTestimonials()`/`getFeaturedTestimonials()` reader in lib/data.ts, and render a quiet quote row on the home page (after About teaser) and, when a testimonial soft-links an artwork's slug, on that /work/[slug] page. Reuse the existing pull-quote styling already used on /about.
- Why: There is literally zero social proof on-site today (recon: NO reviews/testimonials table, type, or component anywhere). For a solo folk artist selling to WhatsApp-arriving strangers, a handful of real buyer quotes is the single highest-leverage trust lift before any structured-data or payment work. It slots cleanly into the existing table+admin-manager+data-seam pattern, so a solo dev ships it in the established groove.
- Research: Artsy Shark and Format both rank buyer testimonials/social proof as a core trust signal for independent artists; overcoming-objections guidance (artsyshark.com) puts credible third-party voice ahead of policy pages.
- Risks: Copy must respect the no-double-dash and no-emoji house rules; keep the section optional (hide when empty, like the WorkFilter 'Available to buy' chip hides at count 0) so an empty testimonials table never ships a bare heading.

**33. Vitest + pure-logic unit suite for lib/ (the actual bug factory)** [testing-quality, next, RICE 36.0, fit 9, low risk, ~0.3wk]

- What: Add Vitest (Next.js's own official runner as of the Feb 2026 docs) with a `pnpm test` script and seed it against the pure, DB-free functions that already exist and have shipped bugs: `slugify` (app/admin/_helpers.ts:26 -- Devanagari/matra/emoji-glue edge cases the comment brags about but nothing verifies), `getNextOrder` (_helpers.ts:53), `deriveStatus` (lib/data.ts:53 -- the archive->available price-derived flip), `formatInr`/`formatEventDate` (lib/utils.ts, including the 'Invalid Date' -> '' guard), `isForSale` (components/gallery/work-filter.tsx:57), `getCtaCopy` (app/work/[slug]/page.tsx:68), and the whatsapp builders `buyArtworkMessage`/`customOrderMessage`/`customOrderMailto`/`assertValidPhone` (lib/whatsapp.ts -- the double-dash/emoji copy rules and the 10-15 digit phone guard). No jsdom, no React render -- these are string/number functions, so the config is `vitest` + `vite-tsconfig-paths` only (needed for the `@/*` path alias).
- Why: There are literally zero tests today and every function above is either a documented past bug (deriveStatus, the reorder off-by-one) or a house-rule guard (no double-dash in copy, phone validation) that only a human eye currently protects. These are the cheapest, highest-signal tests possible -- pure in/out, no mocking -- and they lock the copy + slug + price rules the CLAUDE house rules demand. This is rung 5 of the ladder: playwright is already installed but is the wrong tool for pure functions; add the one dep (vitest) that a few lines can't replace.
- Research: Next.js official Testing guide (nextjs.org/docs/app/guides/testing/vitest, updated Feb 11 2026) recommends Vitest for unit testing and explicitly warns async Server Components aren't unit-testable -- pure lib functions dodge that entirely. Community consensus (noqta.tn Mar 2026, oneuptime Jan 2026) is Vitest has replaced Jest as the 2026 default.
- Risks: Must add `@/*` alias resolution (vite-tsconfig-paths) or imports break. slugify/whatsapp import from files that pull in `next`/DB transitively -- extract the pure fns are already pure but `getCtaCopy` lives inside a page file, so test it by extracting to a tiny lib helper (small refactor) or copy-asserting the copy strings. Keep it to genuinely-pure fns; do NOT try to unit-test the async DB seam here.

**34. FAQPage JSON-LD on /custom-orders (and shipping/returns answers)** [seo, next, RICE 35.0, fit 9, low risk, ~0.4wk]

- What: Add a small on-page FAQ section to /custom-orders answering the real questions the WhatsApp funnel gets -- 'How does commissioning work?', 'When do I pay?', 'Do you ship internationally / from India?', 'How long does a custom piece take?' -- and mark it up with schema.org FAQPage. The answers already exist as scattered reassurance copy ('No payment until we've agreed', '3-step how it works', 'Ships from India after your sign-off'); consolidate into a real Q&A block.
- Why: The custom-orders page already contains the answers as prose but not as an indexable FAQ, and the brief lists NO shipping/returns/FAQ pages as a gap. FAQ content captures long-tail informational queries ('how to commission Madhubani painting'), pre-answers buyer hesitation before the WhatsApp handoff (raising enquiry quality), and is genuinely useful UX. Grounds a documented gap in copy that's already written.
- Research: schema.org/FAQPage -- note Google restricted the FAQ rich result to authoritative gov/health sites in 2023, so the SERP accordion likely won't show for a portfolio; the value is real on-page UX + long-tail content indexing + being ready if eligibility widens. Frame the win as content/UX, not the rich-result badge, to set honest expectations.
- Risks: Don't oversell the rich-result -- Google limits FAQ rich results now (flag this honestly). Questions/answers must be genuine (Google penalizes fabricated FAQ markup). No double-dash in the copy; keep answers in the site's voice. This is content work as much as markup.

**35. LCP audit + explicit width/height on hero and detail plates to kill CLS** [perf-pwa, cut, RICE 35.0, fit 6, low risk, ~0.2wk]

- What: Verify the home HeroPlates and /work/[slug] detail plate reserve space via intrinsic aspect ratio (artworks.aspectRatio, default 0.75) rather than only object-cover in an unsized box, and confirm the AVIF preload maxWidth is in lockstep with the rendered <img> maxWidth (the lib/image-base.ts docstring warns of a double-fetch when they drift). Add width/height or CSS aspect-ratio to any plate that lacks it. Targets LCP + CLS, the two Core Web Vitals that hurt most on slow Indian phones.
- Why: ResponsiveImage renders `absolute inset-0` inside a parent that must own the aspect box; if any hero/detail wrapper lacks a reserved ratio, the image pop-in shifts layout (CLS) and the settle-blur masks it visually but not in the metric. The aspectRatio column exists in schema exactly for this -- confirm it's actually applied to the plate wrapper.
- Research: lib/image-base.ts artworkPreloadSrcset docstring explicitly documents the preload/render maxWidth lockstep bug (preloads 1200w, <img> loads 800w -> double fetch). web.dev Core Web Vitals: reserving image dimensions is the primary CLS fix; matching preload to rendered variant is the primary image-LCP fix. Vercel Speed Insights (already mounted) can confirm field CLS/LCP before/after.
- Risks: Art-image integrity house rule: images shown uncropped, never distort framing -- reserving the box with the true aspectRatio (not a forced uniform ratio) respects this; do NOT force 3:4 on the detail/hero plate (that uniform crop is only for the /work grid).

**36. Email list capture via a free provider (MailerLite/Buttondown), not a raw broadcast build** [marketing-growth, next, RICE 32.7, fit 9, low risk, ~0.75wk]

- What: Add a slim newsletter signup (footer + a soft home-section CTA: 'A few times a year: new work, workshop dates, festival pieces'). Do NOT build a sending engine. Post the email to a free-tier provider's API (MailerLite: 1,000 subs / 12k sends free; or Buttondown: 100 subs free, then cheap) via a server action, and ALSO mirror the email into a local subscribers table so ownership isn't locked to the vendor. Megha writes/sends occasional broadcasts from the provider's dashboard - zero code for sending.
- Why: Recon: 'NO newsletter, no email subscribers.' All growth today is rented on Instagram/WhatsApp - one algorithm change and reach evaporates. An owned email list is the budget-conscious, lock-in-averse channel the brief prizes. The ladder says don't hand-roll SMTP/sending (that's a mailing platform's job) - capture + delegate. Keeping a local mirror table means switching providers later is a re-import, not a rebuild.
- Research: MailerLite free tier: 1,000 subscribers + 12,000 emails/mo with automations and signup forms (Sequenzy/Zanfia 2026). Buttondown: 100 subs free, full API/archive, minimalist - good creator fit. Listmonk+SES is the truly-free-at-scale self-host option ($8-15/mo) but that's an XL ops burden a solo dev shouldn't take on yet. Start hosted-free, keep the local mirror for portability.
- Risks: Adds one external API dependency and an API key (store in env, never commit - house rule). Double opt-in recommended for deliverability. Keep the sending OUT of the codebase - resist scope-creeping into building campaigns in-app.

**37. Screen-reader announcements + prefers-reduced-motion parity for the WhatsApp popup / mailto fallback flow** [a11y, next, RICE 32.0, fit 7, low risk, ~0.15wk]

- What: The custom-order form and per-artwork enquiry open WhatsApp via window.open, and the form has a mailto fallback when the in-app IG/WhatsApp browser blocks the popup (custom-order-form.tsx). Today the success/fallback states are visual ('Your brief is ready in WhatsApp.'). Add an aria-live='polite' region that announces the outcome to screen-reader users ('Your enquiry is ready in WhatsApp' / 'Popup blocked -- use the email link below'), and make the mailto fallback link the programmatic focus target when a popup is blocked so a keyboard user is taken straight to it instead of hunting.
- Why: The dominant traffic source is in-app IG/WhatsApp browsers where window.open is fragile -- a sighted user sees the mailto fallback appear, a blind user gets silence and a chat that never opened. An aria-live announcement + focus management on the fallback is the accessible equivalent of the visual state the form already renders. Reuses the aria-live pattern already proven in work-filter.tsx (the status <p aria-live='polite'>).
- Research: WCAG 4.1.3 Status Messages (AA) -- dynamically revealed status (success, popup-blocked) must be announced without moving focus, via aria-live. Combined with 3.3.1/3.3.3 for the fallback path. aria-live is the framework-native React 19 way, no lib.
- Risks: aria-live regions double-announce if the message string is rebuilt on every render -- set it once on the state transition. The per-artwork enquiry links are plain <a target=_blank> (no popup handling at all) -- decide whether to extend the announce pattern there too or leave them as native links (native link activation is already accessible).

**38. Adopt versioned Drizzle migrations (db:generate + committed ./drizzle) as the prod path** [architecture-dx, next, RICE 31.5, fit 9, low risk, ~0.4wk]

- What: Today docs say db:push is 'rapid dev' but there's no ./drizzle migration dir and no stated prod discipline -- schema changes go straight to Neon with no reviewable SQL diff and no rollback artifact. Switch the workflow so every schema change runs pnpm db:generate (emits SQL under ./drizzle, committed to git) and prod applies via pnpm db:migrate. Add a CI step that fails a PR whose schema.ts changed without a matching committed migration file.
- Why: A single wrong db:push against Neon prod (drop/rename a column) is silent, instant, and unrecoverable with no test suite to catch it. Versioned migrations give a reviewable SQL diff in the PR, a rollback path, and a git-blame history of the schema. For a solo dev this is the cheapest safety net against the one class of mistake (destructive schema change) that no amount of TypeScript catches.
- Research: Drizzle Kit's generate emits timestamped SQL; committing ./drizzle is the documented prod pattern vs push ('for prototyping' per Drizzle docs). Neon serverless supports standard migrations. drizzle-kit generate is idempotent and CI-safe.
- Risks: Slight friction on every schema change (one extra command). Existing prod DB state must be baselined into an initial migration once. Low risk, mostly a discipline change.

**39. Skip-to-region links + landmark audit beyond the single skip-to-content** [a11y, next, RICE 28.3, fit 8, low risk, ~0.3wk]

- What: The layout has ONE skip link (href='#main'). Add a small skip-link cluster (or a single skip that lands past the filter row) so keyboard users on the long /work gallery and the /events photo lists can jump over the pill/filter fieldset straight to the results grid, and verify every page exposes proper landmarks (one <main>, <nav>, <footer>, and a labelled <section> per home block). Confirm the home single-pager's 8 stacked sections each have an accessible name (aria-labelledby on the eyebrow/heading) so a screen-reader rotor can navigate them.
- Why: On mobile-from-WhatsApp traffic, a screen-reader user landing on /work must currently swipe through the entire filter fieldset (All + every style + Available-to-buy) before reaching art. A second skip target and clean landmark labelling is the cheapest big win for SR navigability. The skip-link pattern already exists and works (focus:not-sr-only), so this is extending a proven pattern, not inventing one.
- Research: WCAG 2.4.1 Bypass Blocks (A) + 1.3.1 Info and Relationships (A). ARIA Authoring Practices: multiple skip links and named landmark regions are the standard rotor-navigation aid for long single-pagers.
- Risks: Do not add so many skip links they clutter the first tab stop; one extra 'Skip to gallery' on /work is enough. Keep sr-only-until-focus styling identical to the existing one.

**40. "Recently viewed" rail (localStorage, cookie-free)** [personalization, next, RICE 28.0, fit 9, low risk, ~0.5wk]

- What: A client island that records the last ~8 viewed artwork slugs in localStorage on the detail page + on lightbox-open, then renders a horizontally scrollable rail of those pieces near the bottom of /work and the home page. Store only {slug} (never PII); hydrate the cards from the full catalog already passed to the client, so no re-fetch and no stale price/sold data. Newest-first, de-duped, current piece excluded, empty state renders nothing.
- Why: The brief explicitly scopes this domain to "recently viewed ... with no login (cookie/local)" and nothing like it exists today. Most traffic is one-shot WhatsApp/IG taps; a recently-viewed rail is the lowest-friction way to pull a visitor back into the catalog on their next tap without accounts. Storing slugs only keeps it privacy-clean and immune to price drift.
- Research: localStorage is the accepted pattern for login-less recently-viewed (Shopify community + StackOverflow both use a capped JSON array in localStorage, shifting the oldest out past a limit). Cap the list and prune on write so it never grows unbounded. sessionStorage would reset per tab; localStorage persists across the WhatsApp->browser round-trip which is the whole point.
- Risks: Must respect the seam: the rail hydrates from catalog props already on the client, it does NOT fetch through lib/data.ts client-side. Guard against a stored slug that was later deleted (filter to existing). No animation beyond the existing Reveal token; respect prefers-reduced-motion. Keep the reader/writer in one small hook.

**41. Playwright e2e smoke: WhatsApp deep-link href correctness across every conversion path** [testing-quality, next, RICE 28.0, fit 5, medium risk, ~0.6wk]

- What: A single Playwright spec (playwright is already installed) that boots `next start` against the seeded catalog and asserts the terminal action of every funnel: on /work/[slug], /custom-orders, /workshops, /contact, and the home custom-orders teaser, the WhatsApp CTA's `href` is a valid `https://wa.me/<10-15 digits>?text=...` and the decoded `text` contains the expected fields (artwork title+style for buy, brief/size/budget for custom order). Also assert the /custom-orders mailto fallback href is well-formed. Use `getByRole('link')` locators, not brittle CSS.
- Why: Every single sale and lead on this site is a WhatsApp deep-link -- it is THE conversion surface, and it's built by string concatenation in lib/whatsapp.ts with a phone read from editable site.json. A malformed href = every CTA silently broken with no error tracking (recon confirms no Sentry). The buy/workshop/artwork enquiry links are plain `<a target=_blank>` with no runtime guard. An e2e that reads the real rendered href is the only thing that catches a bad country-code edit or an encoding regression end to end.
- Research: Next.js docs recommend Playwright specifically for e2e (async Server Components can't be unit-tested, and /work/[slug] is an async RSC). Playwright best-practices skill (currents-dev) mandates role-based locators over CSS for robustness. wa.me link format confirmed against the existing WA_URL_RE in the codebase.
- Risks: Needs a running server + seeded DB in CI (secrets + `next build && next start &`), so this is a separate, slower CI job than the unit gate -- gate it on PRs to main only to keep dev-branch CI fast. Don't assert the WhatsApp app opens (out of scope); assert the href only.

**42. BreadcrumbList JSON-LD on /work/[slug] and /events/[id]** [seo, next, RICE 26.7, fit 8, low risk, ~0.15wk]

- What: Add a BreadcrumbList JSON-LD (Home > Artwork > {title}) on artwork detail pages, and Home > Events > {title} on event detail pages if that route lands. There's already a visible 'Back to artwork' link establishing the hierarchy -- this just formalizes it for crawlers. Small helper buildBreadcrumb(items) returning the JSON object, injected via the same script pattern.
- Why: Google replaces the raw URL in search results with a breadcrumb trail when BreadcrumbList is present -- cleaner, higher-CTR SERP listings. The site has clear parent/child hierarchy (/work -> /work/slug) with trailingSlash canonical URLs already, but zero breadcrumb markup. Trivial to add given the URL structure is fixed.
- Research: schema.org/BreadcrumbList is a stable Google rich result (docs: Breadcrumb structured data) that changes the SERP URL display to a named trail. itemListElement positions are 1-indexed ListItem with name+item(absolute URL).
- Risks: Item URLs must be absolute and match the trailingSlash canonical exactly or Google flags mismatch. Keep it to real navigable pages (don't fabricate a category URL that doesn't route). Minimal risk otherwise.

**43. requireMaintainer / isMaintainer auth-guard test (email normalization + root lockout)** [testing-quality, next, RICE 26.7, fit 7, low risk, ~0.3wk]

- What: Unit-test lib/maintainers.ts's pure edges against a mocked `db`: `isMaintainer` returns false for null/undefined/empty email and normalizes case+whitespace before lookup; `removeMaintainer` throws on a root maintainer (the lockout guard) and returns false for a missing email; `listMaintainers` sorts root-first then by createdAt. Then one integration assertion (real branch or mocked action) that a server action wrapped by `requireMaintainer()` throws 'Not authorized.' for a non-maintainer session.
- Why: This is a security boundary -- the Ponytail 'never simplify away security measures' rule and CLAUDE's security section both apply. The whole admin surface is gated by `isMaintainer(email)` and the only thing stopping a lockout is the root-protection branch in `removeMaintainer`. Both are pure enough to test cheaply, and a regression here is either an auth bypass or a permanent lockout -- exactly the failures that must never ship unguarded.
- Research: Standard practice (howtotestfrontend, testparty) is to unit-test auth guards at the trust boundary with a mocked DB; the email-normalization + lockout logic is pure branching, ideal for Vitest. No RSC concern -- these are plain server functions.
- Risks: `isMaintainer` calls `db.select()` so needs `db` mocked (vi.mock on lib/db/client) -- slightly more than pure-fn tests. Don't try to e2e the Google OAuth flow (out of scope, external service); test the allowlist logic that's ours. The normalize() in _helpers.ts vs maintainers.ts differ (one trims, one doesn't) -- the test may surface that drift, which is a real finding worth flagging.

**44. MDX-backed legal pages via a `legal` route group (Privacy, Terms, Shipping & Returns, Refund/Grievance)** [trust-legal-ops, now, RICE 26.7, fit 9, low risk, ~0.6wk]

- What: Add a `app/(legal)/{privacy,terms,shipping-returns,grievance}/page.tsx` set. Because there is genuinely NO transaction on-site (all buying is a WhatsApp deep-link, confirmed in lib/whatsapp.ts and commerce recon), these are short, honest 'how we operate' pages, not boilerplate marketplace T&Cs: how enquiries work, that no payment is taken on-site, how a WhatsApp order is confirmed, who ships and from where (India), the no-return-on-original-art norm with a damage-in-transit exception, and a named grievance contact. Store the body copy in `data/site.json` under a new `legal` key (site chrome already lives there via getSite(), data-model recon) so the solo maintainer edits prose without a deploy. Wire the four new routes into `app/sitemap.ts` (today a hardcoded 7-route array) and link them from the footer's existing bottom bar next to the Admin link.
- Why: India's Consumer Protection (E-Commerce) Rules 2020 mandate accessible disclosure of seller identity, geographic address, contact, return/refund policy and a grievance mechanism for anyone 'offering goods to Indian consumers' -- the site currently has ZERO legal pages (infra-seo + ux recon both confirm). This is the single largest compliance gap and the cheapest to close. It also raises buyer trust for a first-time WhatsApp enquirer arriving cold from Instagram.
- Research: Consumer Protection (E-Commerce) Rules 2020 (effective 23 Jul 2020, under CPA 2019) require e-commerce entities targeting Indian consumers to disclose seller legal name, address, contact, return/refund/warranty policy, total price breakdown incl. taxes+shipping, and a grievance officer with resolution timelines (Synergia Legal compliance playbook; TeamLease RegTech). Rules exclude pure B2B and 'personal sales by individuals' -- a solo artist selling own work sits in a grey zone, so lightweight honest disclosure is the low-risk posture.
- Risks: Must respect the no-literal-double-dash and no-emoji copy rules in the prose. Keep each page well under the 500-line ceiling (they will be short). Don't overclaim a returns policy the artist can't honour -- pull exact terms from Megha before publishing.

**45. Sold-out automation + waitlist deep-link on the detail page** [ecommerce, next, RICE 26.3, fit 8, low risk, ~0.4wk]

- What: Two small linked touches. First, the detail CTA already adapts to sold ('Ask about a similar piece'); extend it so a sold original with a set style offers a 'Notify me about new <style> pieces' WhatsApp deep-link and a 'See available <style> work' link back into the filtered /work. Second, in admin, when a piece is marked sold, surface a one-line reminder to feature a replacement so the gallery never dead-ends on sold items.
- Why: Sold pieces are social proof but currently a soft dead-end. Turning a sold view into 'here's what's still available in this tradition' recovers the intent of a buyer who fell for a specific style, using the existing WhatsApp rail - no new backend.
- Research: Capture interest at the moment of desire even when you can't sell now - take contact and follow up same-day (theabundantartist tip 1). A style-scoped waitlist link is the WhatsApp-native version of that.
- Risks: Keep it a plain <a target=_blank> deep-link like the other per-artwork enquiries - but those are popup-blocker-fragile in in-app browsers (ux snapshot gap); reuse whatever fallback pattern the custom-order form uses if reliability matters. No new table; if a real waitlist is later wanted, it becomes a leads-table row.

**46. Trust-signal footer row: verified channels, location, 'ships from India' with lightweight badges** [conversion-trust, later, RICE 26.3, fit 7, low risk, ~0.4wk]

- What: Add a slim trust strip (its own component, CSS-prop colors only) surfacing the concrete signals kalchar already has: real India location, active Instagram/YouTube handles (link-verified, opening in new tab as the footer already does), 'Original handwork, ships from India', and secure-WhatsApp-contact. Place it above the footer on /work and /work/[slug]. Pure presentation over existing site.json contact data -- no new badges to fabricate.
- Why: Trust badges reduce first-time-buyer hesitation, but kalchar has no payment processor to show a Razorpay/Visa badge, so the honest version is provenance/authenticity/real-channel signals. It reuses the footer's existing 'Reach out' verified-channel data and the location/tagline already in site.json, converting scattered chrome into a deliberate reassurance block right where the buy decision happens.
- Research: Artsy Shark objection-handling and Culturati/Indiahandmade trust framing both lean on transparent seller identity + provenance for handmade goods rather than generic payment badges; for a WhatsApp-native store, 'verified channel + real location + original handwork' is the credible badge set.
- Risks: Avoid fake/generic trust seals (no unearned 'SSL secured' clip-art). Keep it subtle to not compete with the art; must be mobile-first and not push the fold. If it duplicates footer content too closely, scope it to /work* only.

**47. lite-youtube facade embeds (process reels) on artwork detail, journal, and a Watch strip** [content-story, next, RICE 25.2, fit 9, low risk, ~1wk]

- What: A tiny client component that renders a YouTube thumbnail + play button and only swaps in the iframe on click (facade pattern, ~0KB until interaction). Add an optional `youtubeId` field to artworks and journal posts, plus a small 'Watch the process' strip on the home page pulling the latest few videos from the channel (manually curated IDs in a `settings` KV list, or a build-time fetch). Megha already has an active channel (@Kalchar_by_megha) that is currently only a footer/contact link and appears in zero page bodies (grep-confirmed).
- Why: Process reels are the most compelling proof of craft for folk art (the Instagram/YouTube traffic already expects video), yet not one video is embedded on-site -- every visitor is bounced off-platform to watch. A facade embed keeps LCP/CLS clean (critical: mobile-first, image-heavy site with images.unoptimized) while letting a 'watch me paint this piece' clip sit right next to the WhatsApp enquiry CTA on the artwork detail page.
- Research: Sanity + web perf guidance: a lite-youtube facade cuts ~500KB+ per video off initial load by deferring the iframe until click; native loading="lazy" is the fallback. paulirish/lite-youtube-embed is the reference implementation (a few lines, no dependency). Aligns with kalchar's deliberate hand-rolled <picture>/no-next-image performance stance.
- Risks: Respect prefers-reduced-motion on the play affordance; no autoplay. Keep it dependency-light -- a ~40-line component beats pulling a package (ponytail rung 5/6). Ensure the play button is a real <button> with an accessible label, and the thumbnail alt names the piece. Don't hardcode the channel ID as a raw literal in a component -- read from site.json.

**48. Transliterated slugs + Hindi keyword aliases for artwork search discoverability** [i18n, next, RICE 25.0, fit 8, low risk, ~0.3wk]

- What: Keep the canonical URL slug ASCII (the existing Devanagari-aware `slugify` already handles Unicode input by transliterating), but add an optional per-artwork `keywordsHi` free-text field (or derive from `titleHi`) injected into that page's meta keywords / JSON-LD `keywords` and the VisualArtwork schema. So a piece titled 'Radha Krishna' also carries राधा कृष्ण / माधुबनी as discoverable terms without changing the URL.
- Why: Indian users often search in Hindi or romanized Hindi ('madhubani painting radha krishna'). Surfacing Devanagari keywords in structured data helps those queries land, without the risk of Devanagari in URLs (which some in-app browsers and WhatsApp previews mangle). Low-effort discoverability lever specific to the folk-art niche.
- Research: Google advises against relying on locational meta tags but supports content-language signals and structured data keywords for relevance. Devanagari in URLs percent-encodes to long ugly strings that break WhatsApp/IG link previews (the dominant traffic source), so ASCII slug + Devanagari-in-metadata is the safe split. VisualArtwork / CreativeWork schema.org types accept multilingual keyword arrays.
- Risks: Overstuffing keywords can look spammy - cap to a handful of genuine terms. Best paired with the bilingual-catalog idea (reuse titleHi rather than a second field). If the titleHi field lands, this becomes near-free.

**49. Persist custom-order & artwork enquiries as leads (the deferred Phase-2 row) with an admin queue** [conversion-trust, next, RICE 24.0, fit 8, medium risk, ~0.75wk]

- What: Before opening WhatsApp, POST the drafted enquiry to a server action that writes an `enquiries` pgTable row (id, kind size/budget/timeline/style/brief for custom, or artworkSlug for a piece, name nullable, createdAt, status new/contacted/closed). Add a small /admin/enquiries list with status toggles (reuse useServerSyncedList + confirm-dialog). The WhatsApp/mailto deep-link still fires exactly as today; persistence is fire-and-forget so a blocked popup or in-app browser never loses the lead.
- Why: Recon: contact + custom-orders persist NOTHING; CustomOrderDraft's own docstring says 'Phase 2 stores it as a row and adds an admin queue' and that row doesn't exist. Today, if the IG in-app browser blocks window.open (the acknowledged fragility) the enquiry evaporates -- a direct conversion loss. Capturing the lead means the artist can follow up even when the deep-link fails, which is the core enquiry-to-sale lift for this funnel.
- Research: n/a -- grounded in the codebase's own stated Phase-2 plan and the recon-confirmed popup-blocker fragility from Instagram/WhatsApp in-app browsers (dominant traffic source).
- Risks: PII now stored in Neon -- add a privacy line to the form and keep the enquiries route maintainer-gated. Keep it lazy: no email-send integration, no CRM; a queue list is enough. Persistence must not block the WhatsApp redirect (await-less or optimistic).

**50. WhatsApp enquiry counter -- the one metric that matters** [admin-cms, now, RICE 24.0, fit 9, medium risk, ~1wk]

- What: Add a lightweight `enquiries` table (slug/context, createdAt, kind) and route every WhatsApp/mailto deep-link tap through a tiny fire-and-forget server action (or a /api/tap route + sendBeacon) that inserts a row, then opens the link. Surface per-artwork tap counts as a 5th column in the admin artwork list and a 'most-enquired this month' card on the dashboard. No PII, no message body -- just 'someone tapped Enquire on <slug>'.
- Why: The whole business funnels to WhatsApp deep-links (lib/whatsapp.ts) and the maintainer is completely blind to which pieces actually generate enquiries -- the dashboard only shows total/available/sold/featured counts (page.tsx:10). Knowing 'the Pichwai got 12 taps, the Gond got 0' tells Megha what to make more of and what to feature. This is the single highest-leverage admin signal and it needs no third-party analytics vendor.
- Research: Off-the-shelf tools (Linkly, WhatsLink PRO) exist purely to add click-attribution to wa.me links because plain wa.me carries zero tracking -- confirming the gap is real and that a self-hosted counter avoids a paid subscription. sendBeacon/keepalive fetch fires the insert without delaying window.open, so the tap still lands instantly on the dominant in-app-browser traffic.
- Risks: Must respect popup-blocker fragility: the insert must NOT block or defer the link open (fire-and-forget, ignore failures) or in-app IG/WhatsApp browsers could drop the enquiry. Keep it strictly aggregate -- no visitor identifiers -- to stay privacy-clean with no consent banner.

**51. Sold-ribbon and status-change motion: a considered 'sold' treatment beyond the diagonal band** [ux-motion, later, RICE 24.0, fit 8, low risk, ~0.3wk]

- What: The current sold state is a static rotated 'Sold' band. Refine it: a one-time, on-enter draw of a hairline gold-leaf seal/underline beneath the ribbon (reusing flare-grow width animation) and a faint desaturation of the plate on hover to signal 'archived, not for sale' -- so sold pieces read as honoured-and-kept rather than merely disabled. Keep the 'Ask about a similar piece' CTA copy that already adapts (getCtaCopy).
- Why: Sold pieces are social proof (they prove work sells) but currently look like an error state (a slapped-on band). A small dignified treatment turns them into part of the story, which matters for an artist portfolio where 'sold' is a positive signal.
- Risks: Don't hide the Sold status or make it ambiguous (a11y: keep the text label and aria). Desaturation must not distort framing -- it's a filter on hover, reversible, reduced-motion-safe.

**52. Central typed env module with @t3-oss/env-nextjs (lib/env.ts)** [architecture-dx, next, RICE 24.0, fit 6, low risk, ~0.4wk]

- What: Replace the six scattered raw process.env reads + hand-thrown guards (lib/db/client.ts:16, lib/storage/r2.ts:18-23, lib/image-base.ts:16-17, app/layout.tsx:24, app/admin/actions.ts:162) with one createEnv schema splitting server vars (DATABASE_URL as url, AUTH_SECRET min 32, R2_* keys) from client (NEXT_PUBLIC_IMAGE_BASE_URL as url). Every module imports the typed env object instead of process.env. Kills the two silent `?? ""` fallbacks in image-base.ts that let an empty image base ship a site with broken <picture> srcsets to prod.
- Why: Solo dev with zero test coverage: a missing/typo'd Vercel env var currently fails at random runtime (or worse, silently serves broken images because of the `?? ""`). t3-env fails the build with a named error instead of a 3am debugging session. One validator becomes the single source of truth that .env.example and CI both derive from.
- Research: @t3-oss/env-nextjs (create.t3.gg/en/usage/env-variables) wraps zod, validates at both build and runtime, tree-shakes client vars out of the server bundle, gives Cmd-click-to-definition on env.VAR. StackOverflow 77551616 documents the build-time gotcha: use skipValidation:!!process.env.SKIP_ENV_VALIDATION so pnpm db:push/tsx scripts that don't need every var don't fail.
- Risks: zod is a new dependency (kalchar has none today) -- flag against the budget/low-dep preference, though it's server-only and unlocks ideas below. Must set skipValidation for the db:* scripts or they'll demand R2 creds they don't use.

**53. Persist custom-order briefs as leads (finally build the Phase-2 row the type already promises)** [ecommerce, next, RICE 22.4, fit 9, medium risk, ~0.75wk]

- What: Add a customOrderLeads table (id, name, style, size, budget, timeline, brief, createdAt, status: new|replied|archived) and a server action submitCustomOrder that inserts the draft, then still opens WhatsApp/mailto as today. Show leads in /admin with a status dropdown. The form keeps its exact WhatsApp behavior - the DB write is additive and fire-and-forget so a DB hiccup never blocks the WhatsApp open.
- Why: Right now a blocked popup in the Instagram in-app browser can lose a brief entirely, and even successful ones vanish once the chat scrolls. The CustomOrderDraft type's own docstring says 'Phase 2 stores it as a row and adds an admin queue' - this is the promised feature, not a new invention. A solo artist loses commissions to forgotten DMs; a queue is the fix artists explicitly ask for.
- Research: Artist-commission best practice is a written brief capturing size/price/timeline/terms before work starts (theabundantartist 8 tips; Safe Space for Artists thread on deposit-vs-upfront). Storing the brief server-side is the precondition for any deposit or agreement step later.
- Risks: Lead capture stores buyer name + phone/context = personal data; keep it minimal, no analytics fan-out, and add a one-line 'we keep this to reply to you' note (mobile-first, no double-dash in copy). Must be additive: the WhatsApp open must fire even if the insert throws, or you regress the current always-works link.

**54. Quick-add from phone -- one-tap camera-to-catalog** [admin-cms, next, RICE 22.4, fit 9, low risk, ~0.5wk]

- What: A stripped 'Quick add' entry on the mobile bottom tab bar: an `<input type=file accept=image/* capture=environment>` that fires the camera, plus just Title (medium/style pre-filled from the last-used values held in settings). It reuses createArtwork, lands the piece as a Draft (pairs with the hidden-status idea), and the maintainer fills the rest later from a proper screen.
- Why: The maintainer is India-based, solo, phone-first, and photographs finished pieces on a phone -- but createArtwork requires title+style+medium+image up front through the full upload-form. There's no fast 'snap it now, describe it later' path. This is the named 'quick-add from phone' gap and it directly serves the mobile-first, budget-conscious, solo-maintainer profile.
- Research: The HTML `capture=environment` attribute opens the rear camera directly on Android/iOS with zero JS or library -- a native platform feature that beats any upload widget. Draft status (idea above) means a half-filled quick-add never embarrasses the public gallery.
- Risks: Depends on the draft/hidden flag to be safe (a bare quick-add without it would publish a titled-but-undescribed piece instantly). Vercel's ~4.5MB platform request cap (noted in next.config.mjs) means a raw 12MP phone photo may need client-side downscale before the sharp pipeline; test with a real phone shot.

**55. Razorpay Payment Link on the artwork WhatsApp CTA (zero-schema pay path)** [ecommerce, next, RICE 22.0, fit 8, low risk, ~0.5wk]

- What: Keep the WhatsApp-enquiry model but let the artist close the sale with money instead of just a chat. Add a per-artwork admin field for a pasted Razorpay Payment Link (created in 2 min from the Razorpay dashboard, no code), stored in a new nullable artworks.paymentLink text column. On the detail page and lightbox, when a piece is available AND priceInr is set AND a link exists, render a secondary 'Pay now (UPI/card)' button next to the existing 'Enquire on WhatsApp' CTA. buyArtworkMessage stays the primary path for the hesitant buyer; the pay button serves the ready one. No cart, no checkout route, no products table.
- Why: The dominant traffic is WhatsApp/Instagram taps by impulse art buyers (theabundantartist: art is a luxury impulse buy, close at the right moment). Today the only close is a manual chat. A pasted link is the laziest possible on-site payment: the artist already gets the money, no gateway integration, no webhook, no PCI surface. Respects 'store = a lens' - it is a per-piece link, not a cart.
- Research: Razorpay Payment Links generate a shareable UPI/card URL in under two minutes, no website/code, shareable over WhatsApp/Instagram DMs, 100+ payment modes, 2% + GST domestic (razorpay.com/blog/payment-links-vs-checkout-pages-vs-storefronts; qikink.com pricing 2026). UPI processed 228B txns in 2025, much of it small sellers via links/QR.
- Risks: A pasted link is not verified as paid on-site (artist reconciles in Razorpay dashboard), so the 'sold' flip stays manual - acceptable for a solo maintainer. Must not distort the art-image-first layout; button is secondary, WhatsApp stays primary. House rule: no raw hex - reuse the accent CSS custom prop the vermillion chip uses.

**56. 'Recently viewed' rail, client-side, on /work and the detail page** [engagement-retention, next, RICE 22.0, fit 8, low risk, ~0.5wk]

- What: Track the last ~8 viewed artwork slugs in localStorage (push on lightbox-open / detail mount) and render a horizontal 'Pieces you looked at' rail at the bottom of /work and under /work/[slug]. Reuses ArtworkCard. Hidden when the list is empty or has one item. No DB.
- Why: Return visitors from a WhatsApp re-tap land cold; a recently-viewed rail rebuilds their session context instantly and re-surfaces pieces they were deciding on -- the classic soft nudge back toward an enquiry. It also lengthens time-on-site, which the artist-strategy source flags as the meaningful metric for collectors, without any tracking vendor.
- Research: workwithem.co.uk 'strategic artist website' guidance: accommodate the collector journey across first-visit vs returning-visit states -- recently-viewed is a low-cost returning-visitor affordance that platforms usually bury.
- Risks: Overlap with wishlist if both ship -- keep them visually distinct (passive history vs deliberate save). Cap the array length to avoid unbounded localStorage growth. Same hydration-guard caveat as the wishlist.

**57. Hidden/draft status -- decouple 'work in progress' from price** [admin-cms, next, RICE 21.6, fit 9, low risk, ~0.5wk]

- What: Add a `hidden` boolean to artworks (or a 4th status value 'draft') so the maintainer can upload and stage a piece -- image, palette, description -- without it appearing on /work or the home rails until they flip 'Publish'. Filter it out in the data seam's public getters (getAllArtworks) while admin still sees it, badged 'Draft'.
- Why: Today create = instantly live (createArtwork revalidates / and /work in the same call, actions.ts). The only lifecycle is the price-driven archive/available/sold triple, so there is no way to prep a piece over several sittings -- a real need for a solo artist photographing on a phone in poor light who wants to fix the shot before it's public. This is the explicitly-named 'drafts' gap.
- Research: Ships as a single boolean + one seam-level filter rather than a separate workflow engine -- the data seam being the sole catalog access (house rule) means one filter guarantees drafts never leak to any page or the sitemap.
- Risks: app/sitemap.ts uses getAllArtworkSlugs -- must confirm drafts are excluded there too, or Google indexes an unpublished piece. Since deriveStatus() auto-promotes archive→available when priced, 'hidden' must be an orthogonal flag, not a status value, so a priced draft still stays hidden.

**58. Tax-inclusive price display with a 5% GST line and HSN 9701 note on priced pieces** [trust-legal-ops, next, RICE 21.0, fit 8, medium risk, ~0.4wk]

- What: Where a piece shows `priceInr` (detail page, lightbox, work-filter card), add an optional small 'Price includes 5% GST (HSN 9701, hand-painted original)' line, gated by a single boolean setting in the `settings` KV table (e.g. `showGstNote`) so the maintainer can toggle it the same way the home-intro toggle already works. Add a `formatInrWithTax`-style helper next to the existing `formatInr` in lib/utils. Do NOT add tax calculation to a cart (there is no cart) -- this is a disclosure label on the listed price only.
- Why: GST on hand-painted Indian folk art (Madhubani, Pichwai, Tanjore et al.) was cut from 12% to 5% in Sept 2025 under GST 2.0 -- a concrete selling point ('art is now more affordable') AND a disclosure the E-Commerce Rules expect (price breakdown incl. taxes). Naming HSN 9701 signals professionalism to serious/interior-designer buyers.
- Research: GST Council consolidated slabs and moved 'paintings, drawings, pastels executed entirely by hand' (HSN 9701, explicitly incl. Madhubani/Rajasthani/Tanjore/Palm-leaf) from 12% to 5% effective 22 Sep 2025 (EPCH official rate PDF; DisyTax HSN-97; ClearTax Chapter-97; Mazda Art / GST2.0 analysis). Whether the artist is GST-registered determines if she can/should charge it -- verify registration status before enabling the note.
- Risks: Only enable the note if Megha is actually GST-registered and remitting; a false tax claim is worse than none. Keep it a config-gated label, default OFF. No raw hex / magic-timing concerns (text only).

**59. DPDP-aligned privacy notice + a lightweight, no-vendor cookie/analytics consent bar** [trust-legal-ops, next, RICE 21.0, fit 7, low risk, ~1wk]

- What: Two parts. (1) The `privacy` page from idea #1, written to DPDP Rules 2025 notice shape: what personal data the site touches (basically none server-side -- enquiries go to WhatsApp; only Vercel Analytics + Speed Insights run client-side), purpose, and a contact to exercise rights. (2) A minimal consent bar as a client island that gates loading of `@vercel/analytics`/`@vercel/speed-insights` (currently mounted unconditionally in layout.tsx) behind an accept, persisting the choice in localStorage. No third-party CMP dependency -- a ~40-line component honouring the existing prefers-reduced-motion and CSS-custom-prop rules.
- Why: DPDP Act 2023 + DPDP Rules (notified 13 Nov 2025, full compliance by 13 May 2027) apply to anyone processing Indian data principals' data while offering goods/services in India, and require a clear privacy notice + consent. Even though the site is data-light, a visible privacy notice is now table stakes and cheap. Gating analytics behind consent is the honest default.
- Research: DPDP Rules 2025 notified 13 Nov 2025, phased: governance immediate, Consent Manager framework by 13 Nov 2026, full operational compliance by 13 May 2027 (Fisher Phillips; DLA Piper; EY; Seqrite). Privacy-notice + verifiable-consent are core obligations. Vercel Analytics is cookieless by default, which weakens the strict legal need for a bar -- so frame this as trust + future-proofing, and consider notice-only if the artist wants zero UI friction.
- Risks: Consent bar adds mobile friction for WhatsApp-tap traffic (the dominant source) -- keep it a slim bottom sheet, dismissible, non-blocking. Vercel Analytics being cookieless means a full bar may be more than legally required; offer a notice-only variant. Don't tone down motion elsewhere to accommodate it (house rule).

**60. Data-seam price integrity + sold-out guard so a live-editable catalog never advertises a stale/available-but-unpriced state** [trust-legal-ops, next, RICE 21.0, fit 8, low risk, ~0.4wk]

- What: Harden the operational trust seam: add one guard in `deriveStatus()`/getAvailableArtworks (lib/data.ts) plus a matching admin-save validation so a piece can't be published as 'available' with a missing or non-positive priceInr, and a sold piece can never leak into the 'Available to buy' filter count. Add a tiny assert-style self-check (the repo has no test runner, so a `demo()` in the module or a scripts/-runnable check) that fails if an available piece has no price or a sold piece is counted as for-sale.
- Why: Advertising an original as 'available to buy' when it's actually sold, or showing an available piece with no price, is a consumer-trust and (loosely) unfair-trade-practice risk under the E-Commerce Rules, and it's an operational footgun the moment the artist toggles status in admin mid-enquiry. The store is a live filter over mutable rows (isForSale = priceInr is number && status !== 'sold', work-filter.tsx:57-59) with status partly DERIVED (deriveStatus flips archive→available when price is set) -- so the invariant lives in exactly one place and is worth pinning.
- Research: E-Commerce Rules 2020 prohibit unfair trade practices incl. misrepresenting availability/price (International Trade Council; Paradigm Press). No new dep needed -- this is a guard + one assert, matching the repo's existing concurrency-safe nextOrderSql discipline.
- Risks: Keep it a single guard at the seam, not per-caller checks (root-cause not symptom). The self-check must not need a framework (repo has none) -- one runnable assert. Don't change the store=filter architecture (house rule).


---

_Note: the `community-workshops` domain agent failed on an API error mid-run, so workshop booking/RSVP/ticketing ideas are under-represented here. Worth a targeted follow-up._
