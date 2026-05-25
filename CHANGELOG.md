# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning follows [SemVer](https://semver.org/). Bump rules live in [`CLAUDE.md`](CLAUDE.md).

## 1.12.0 (2026-05-25)

Three voice-and-positioning lifts inspired by a peer artist's site (Shivani Gupta, "trippin-on-hue / The Neutrals -- India"). Captured the page with Playwright, read its 30-section structure, and pulled the patterns that translate to ours without copying anything that hurts mobile or accessibility.

### Added

- **Capability chip rail on the home hero** ([app/page.tsx](app/page.tsx)) -- between the hero description and the CTA buttons, a wrap-friendly row of style chips ("Madhubani", "Pichwai", "Lippan", "Gond", "Texture", "Mixed Media") sourced from `getSite().styles`. Tells a cold WhatsApp / Instagram visitor what Megha actually paints in 2 seconds, before they need to scroll. Mobile-first: smaller chip type at base, scales up at sm:; `flex-wrap` keeps the rail honest at every width. Same data drives the `/work` filter, so positioning and navigation stay aligned.
- **`SOLD` corner ribbon on artwork cards** ([components/gallery/artwork-card.tsx](components/gallery/artwork-card.tsx)) -- when an artwork's `status` is `"sold"`, a diagonal ribbon rides the top-left corner of the image plate in the ruby pigment. `pointer-events-none` so the whole card stays clickable through the ribbon (the link still routes to the detail page). The "Available" pill stays mutually exclusive with the ribbon. The ribbon also weaves into the link's `aria-label` ("Title, Style, sold") so screen readers don't miss the state. Today no rows are marked sold (Phase 1 derives status from price), but the wiring activates the moment any row gets `"status": "sold"` in `data/artworks.json` -- inventory honesty as a feature, social proof for visitors.

### Changed

- **`/work` color-block header band** ([app/work/page.tsx](app/work/page.tsx)) -- the page now stacks two full-bleed sections: a `bg-bg-soft` header band (eyebrow, H1, BrushStroke, lead, count), then a `bg-bg` gallery band (filter pills + grid). Gives /work a museum-room silhouette without fragmenting gallery rows or breaking on the mobile 2-col grid. Removed the redundant `mt-10 sm:mt-12` from [components/gallery/work-filter.tsx](components/gallery/work-filter.tsx) -- the section's `py-(--section-py)` now owns the top space.

## 1.11.3 (2026-05-25)

Reverts the painterly background from every subpage. 1.11.0 carried the home hero's recipe (PigmentWash + rich-tone2 InkSplash + counter-splash) onto `/work`, `/about`, `/workshops`, `/custom-orders`, `/contact` so the visual register wouldn't collapse past `/`. After living with it, the wash on subpages read busy rather than painterly -- it competed with the editorial copy on `/about`, the dense form on `/custom-orders`, the card grids on `/work` and `/workshops`, and the channel hierarchy on `/contact`. Home is the right place for the painterly hero (the whole page is decor + headline by design); subpages are reading and interaction surfaces and want a calmer ground. Decor components stay in the codebase -- the home page is unchanged.

### Changed

- **Subpages drop PigmentWash + paired InkSplashes.** [app/work/page.tsx](app/work/page.tsx), [app/about/page.tsx](app/about/page.tsx), [app/workshops/page.tsx](app/workshops/page.tsx), [app/custom-orders/page.tsx](app/custom-orders/page.tsx), [app/contact/page.tsx](app/contact/page.tsx) -- removed the JSX block right after the `<main>` open. Section accent tokens (ruby / marigold / pichwai / vermillion / peacock) still drive eyebrow underlines, accent rules, hover rings, and pull-quote borders, so the per-route identity stays without the background bleed.
- **`/custom-orders` form panel** ([app/custom-orders/page.tsx](app/custom-orders/page.tsx)) -- the `relative z-10 bg-bg` container that was added in 1.11.2 to defend input legibility against the wash is no longer needed; reverted to `bg-bg-soft` to match the rest of the surface tokens.

## 1.11.2 (2026-05-25)

Visual-audit pass with Playwright. Captured every route at mobile (390x844) and desktop (1440x900), primed the IntersectionObserver-driven `<Reveal>` blocks via programmatic scroll so the fullPage screenshots actually show the below-fold sections, then read each PNG and the per-route console log. Three reproducible findings: two LCP-priority warnings on above-fold images, and a contrast issue on `/custom-orders` where the orange wash bled across the form panel and made input fields harder to read. All three fixed; remaining LCP warnings on `/work` desktop / home mobile turned out to be dev-mode flakiness (LCP candidate varies per load when many same-size cards are above-fold) and don't reproduce on the production build.

### Fixed

- **`priority` on the first 3 cards of `/work`** ([components/gallery/work-filter.tsx](components/gallery/work-filter.tsx)) -- the gallery page's first row is the LCP candidate at both viewports; `ArtworkCard` already accepted `priority` but `WorkFilter` wasn't passing it. Now `priority={i < 3}` on the visible grid.
- **`priority` on the home Selected Work first card** ([app/page.tsx](app/page.tsx)) -- on mobile the hero piece sits in its own block and the first card of the Selected Work rail is the next LCP candidate. Pass `priority={i === 0}`.
- **`priority` on the Instagram QR** ([app/contact/page.tsx](app/contact/page.tsx)) -- the QR plate is the LCP image on `/contact` mobile (it sits above the fold immediately after the WhatsApp hero). Now eagerly fetched.
- **Form contrast on `/custom-orders`** ([app/custom-orders/page.tsx](app/custom-orders/page.tsx)) -- the rich vermillion + marigold splash had a 70%-wide plume that bled across the form column at sm:+ widths, tinting input field backgrounds and reducing legibility on the densest interactive surface in the site. Tightened the splash plume to `sm:w-[52%]` (kept on the left rail behind the "How it works" steps), pulled the counter-splash smaller and lower so it doesn't crowd the form either, and switched the form panel from `bg-bg-soft` to a `relative z-10 ... bg-bg` container so the cream ground sits opaque above the wash. Painterly register preserved on the left rail; form column now reads cleanly.

## 1.11.1 (2026-05-25)

Audit-pass polish. After 1.11.0 shipped, an a-to-z code review surfaced a handful of small inconsistencies: stale "Hi Megha" voice in three WhatsApp message templates (the page copy moved to plural-voice in 1.7.0 but the deep-link drafts didn't follow), a token-overriding `tracking-tight` on the footer wordmark, a flat copyright bar where the attribution sat at the same weight as the legal line, and three components still concatenating className strings by hand instead of using the project's `cn()` helper. No visual redesign -- just closing the gap between the voice the visitor reads and the message they tap through to send.

### Changed

- **WhatsApp message templates drop "Megha" from the salutation.** [lib/whatsapp.ts](lib/whatsapp.ts) (buy + custom-order) and [app/workshops/page.tsx](app/workshops/page.tsx) (per-workshop enquire) now open with `Hi, I'd like to ...` instead of `Hi Megha, I'd like to ...`. Matches the plural-voice page copy ("we'll get back to you") so the visitor's reading register and their pre-filled draft register stay aligned.
- **Footer wordmark** ([components/layout/site-footer.tsx](components/layout/site-footer.tsx)) -- removes the `tracking-tight` Tailwind utility (which silently overrode the `--tracking-display` token), bumps to `text-3xl` / `sm:text-[2rem]` with `leading-none`, and switches the location line to a `t-meta`-style `uppercase tracking-meta` micro-line so the brand block reads as three deliberate weights (display word / body tagline / meta location) instead of three same-size lines.
- **Footer copyright bar** -- bumps the "Site by Sagar Gupta" attribution to `text-[0.65rem]` + `opacity-50` so it sits visibly below the legal line in the visual hierarchy. Same content, clearer intent.
- **`cn()` adoption.** [components/decor/brush-stroke.tsx](components/decor/brush-stroke.tsx), [components/decor/motif-eyebrow.tsx](components/decor/motif-eyebrow.tsx), and [components/gallery/chromacard.tsx](components/gallery/chromacard.tsx) now compose className strings with `cn()` from `@/lib/utils` instead of template-literal concat with `.trim()` / fallback empty strings. Same output, but the helper handles falsy guards consistently and matches the rest of the codebase.

### Fixed

- **`ScrollProgress` JSDoc** ([components/decor/scroll-progress.tsx](components/decor/scroll-progress.tsx)) -- the comment claimed the bar "sits behind everything except modals (z-50)" but z-50 is a high z-index, so the bar actually sits above the page chrome. Comment now matches the implementation.

## 1.11.0 (2026-05-25)

Subpage backgrounds now match the home hero recipe, and `/contact` gains a scannable Instagram QR. The 1.8-1.9 painterly register stopped at the home hero -- every other route ran with one subtle splash on cream, so the visual weight collapsed past `/`. Each subpage now layers a rich primary splash with a `tone2` second-pigment bleed plus a subtle counter-splash on the opposite side, in pigment pairings tuned per route.

### Added

- **Instagram QR card on `/contact`** ([app/contact/page.tsx](app/contact/page.tsx)) -- 192-224px QR plate sits between the WhatsApp hero plate and the IG/Email two-up grid. Themed bg-soft surface, peacock hover ring, "Scan to follow" eyebrow + "Or scan, point, follow" headline + a "Open Instagram instead" ghost link for desktop visitors who'd rather tap. Image at [public/instagram-qr.png](public/instagram-qr.png), source-of-truth URL still pulled from `data/site.json` `contact.instagram.url`.

### Changed

- **Every subpage hero gets the home recipe.** Replaces the single subtle right-aligned `InkSplash` with a rich left-aligned splash (with a complementary `tone2` bleed) plus a subtle right-aligned counter-splash. Same SVG primitives, same geometry as the home hero -- only the pigments rotate. The painterly register now reads consistent across all six routes, not just `/`.
- **Subpage pigment pairings:**
  - `/work` -- ruby primary + vermillion bleed, peacock counter
  - `/about` -- marigold primary + vermillion bleed, pichwai counter
  - `/workshops` -- pichwai primary + marigold bleed, peacock counter
  - `/custom-orders` -- vermillion primary + marigold bleed, ruby counter
  - `/contact` -- peacock primary + pichwai bleed, marigold counter

## 1.10.0 (2026-05-25)

Single-pager. Most arrivals are WhatsApp / Instagram link-taps -- a flat short home plus four full subpages was over-routing visitors who just wanted to scroll once. The home now carries a teaser of every section inline; the detail pages stay intact for deep-links and longer reads. No page is removed; nothing in the catalog moves.

### Added

- **Workshops teaser on `/`** -- 3-card preview of the top sessions (by `order`) in the pichwai pigment, with motif eyebrow `lotus` numbered `04`. Cards mirror the `/workshops` register (title + line-clamped blurb + duration pill) but drop the per-card enquire link to keep the teaser reading as a sample, not a list. "See all N sessions ->" footer link routes to the full page. Hidden when there are zero workshops in `data/site.json`.
- **Custom orders teaser on `/`** -- 3-step process strip (Brief / Talk / Painted, approved, shipped) in the vermillion pigment, with motif eyebrow `mirror-diamond` numbered `05`. Primary "Start on WhatsApp" button deep-links into `wa.me/<phone>?text=...` with a short pre-filled message; secondary "Open the brief form ->" link routes to the full `/custom-orders` page when the visitor wants the structured form. Lifts the same `TeaserStep` shape used on the full page.
- **Contact teaser on `/`** -- 3-channel row (WhatsApp highlighted, Instagram, Email) in the peacock pigment, with motif eyebrow `rangoli-star` numbered `06`. WhatsApp card gets a tinted border so the fastest channel reads first on mobile. "Full contact page ->" link routes to `/contact` for the hero-plate version with the response-time chip.

### Changed

- **Home page tree is now 7 sections** -- Hero / Marquee / 01 Selected work / 02 Available now / 03 About teaser / 04 Workshops teaser / 05 Custom orders teaser / 06 Contact teaser. Replaces the 5-section flow that ended at "Workshops + Custom Orders CTAs" with no contact path inline.
- **`CtaPair` removed.** The two-card Workshops + Custom Orders block on the home page is replaced by the three full teaser sections above; the same destinations are still reachable from header nav, the new in-page links, and the footer. Section composition lock in [MEMORY.md](MEMORY.md) updated.

## 1.9.0 (2026-05-25)

Painterly register, take two. The 1.8.0 layer landed but read too quiet on the cream ground -- paper grain at 7%, pigment wash at 12% alpha, and no shape-language anywhere. This release adds two new SVG primitives (ink splash + brushstroke), cranks the existing grain and wash, and fixes two regressions surfaced by a manual audit. Still no 3D, no particles, no WebGL -- the painterly feel comes from organic shapes, not from animating a render loop.

### Added

- **`InkSplash`** ([components/decor/ink-splash.tsx](components/decor/ink-splash.tsx)) -- watercolor wash. Several overlapping coloured ellipses passed through one `feGaussianBlur` filter so the edges feather outward like wet paint on cream paper, plus a hand-placed scatter of crisp splatter dots OUTSIDE the filter so they stay sharp like a brush flick. `mix-blend-multiply` (light) / `mix-blend-screen` (dark) so the wash composites correctly on the cream / ink ground. Props: `tone` (defaults to `--section-accent`), optional `tone2` for two-pigment bleed (used on the home hero: terracotta blooming into marigold), `align="left" | "right"`, `density="subtle" | "rich"`. Page headers all use the same composition (top-right, density="subtle", route's `--section-accent`); only the home hero gets the rich variant + tone2 blend. Replaces the first-pass blob, which read as a flat coloured shape rather than paint.
- **`BrushStroke`** ([components/decor/brush-stroke.tsx](components/decor/brush-stroke.tsx)) -- long curved horizontal sweep in `--section-accent` that draws in like a fresh brush stroke when scrolled into view (1.2s `pathLength` reveal + a thinner trailing wisp at 0.4s delay for bristle-drag feel). Used as the underline beneath every page H1 and section H2, replacing the implicit underline. Reduced-motion is handled by the global `MotionConfig reducedMotion="user"` so no SSR/CSR mismatch (lesson from `MotifEyebrow`).

### Changed

- **Paper grain opacity 0.07 -> 0.11.** The cream-paper texture now reads on first paint instead of needing inspector-eyes to find. Still subtle; still doesn't compete with artwork photos.
- **Pigment wash alpha bumped: subtle 0.12 -> 0.18, soft 0.18 -> 0.26.** Each section's pigment now actually glows into the top of its `<main>` rather than hinting at it. /work reads ruby, /about reads marigold, /workshops reads pichwai, /custom-orders reads vermillion, /contact reads peacock -- visibly.
- **Every page H1 + section H2 gains a `<BrushStroke />` underneath.** Home Selected Work / Available Now / About teaser; /work, /about, /workshops, /custom-orders, /contact. Each draws in once when the heading enters view.
- **Home hero gains two ink splashes** (left soft, right subtle). About teaser, /about, /custom-orders, /work get a left-aligned splash; /workshops, /contact get a right-aligned splash. The pigment in each splash inherits the route's `--section-accent`, so the same component reads as marigold on /about and pichwai on /workshops.

### Fixed

- **Palette swatches not rendering on `/work` cards.** [components/gallery/work-filter.tsx:19-32](components/gallery/work-filter.tsx) typed `GalleryItem` as a `Pick<Artwork, ...>` that omitted `palette`, then [app/work/page.tsx:58-72](app/work/page.tsx) mapped each artwork to that shape -- silently dropping `palette` before passing to the filter island. The `art as Artwork` cast on render hid the missing field from TypeScript. Added `palette` to both the picked-fields list and the map. The Chromacard strip now appears under every artwork card on /work, matching the home Selected Work rail.
- **Hydration mismatch on `MotifEyebrow`.** `useReducedMotion()` returns `null` during SSR and the actual preference after hydration, which made `initial={reduced ? false : { opacity: 0 }}` flip between two values across the boundary. Removed the local branch -- the global `MotionConfig reducedMotion="user"` in `MotionProvider` already does the work upstream and never SSR-mismatches.

## 1.8.0 (2026-05-25)

Painterly register, take one. The site was type + photos on flat cream -- no gradients, no textures, no folk-art motifs visible anywhere despite the tradition being named in every page's copy. This release adds the first thematic decoration layer: ambient paper grain, pigment washes, and a hand-drawn motif library. Restrained-motion spec stays locked: no 3D, no particles, no decorative backdrops in the noise sense -- the additions are thematic, single-stroke, and reveal-driven.

### Added

- **`PaperGrain`** ([components/decor/paper-grain.tsx](components/decor/paper-grain.tsx)) -- inline SVG `feTurbulence` layer fixed to the viewport at low opacity, blended `multiply` on light mode and `overlay` on dark mode. The site now reads as warm cream paper instead of flat digital cream. ~600 bytes; no JS, no animation, no listener.
- **`PigmentWash`** ([components/decor/pigment-wash.tsx](components/decor/pigment-wash.tsx)) -- soft radial-gradient backdrop in the page's `--section-accent`, painted into the top of each route's `<main>`. Two stacked gradients (centre dome + off-axis bloom) at 12-18% pigment opacity. Each route already sets its own pigment, so /work glows ruby, /about glows marigold, /workshops glows pichwai, /custom-orders glows vermillion, /contact glows peacock, and the home About teaser glows marigold. CSS-only, uses `color-mix(in oklch, ...)` for clean blending against the cream ground.
- **Folk-art motif library** ([components/decor/motifs/index.tsx](components/decor/motifs/index.tsx)) -- seven single-stroke line-art SVG motifs as React components: fish (Madhubani), lotus (Pichwai), mirror-diamond (Lippan), leaf (Gond), paisley, peacock-feather, rangoli-star. Each renders in `currentColor` so one component works in any pigment, at any size. Uniform 24x24 viewBox.
- **`MotifEyebrow`** ([components/decor/motif-eyebrow.tsx](components/decor/motif-eyebrow.tsx)) -- replaces the `<span className="h-px w-6">` accent rule that sat next to every section eyebrow with a folk-art motif glyph in the same pigment. Path-draws in once on scroll-into-view via Motion's `pathLength` primitive (1.1s ease-out-soft). Reduced-motion -> renders the motif instantly, no animation.

### Changed

- **Every page eyebrow gains a motif glyph** -- home Selected Work gets paisley (terracotta), home Available Now gets lotus (terracotta), home About teaser gets peacock-feather (marigold), /work gets fish (ruby), /about gets peacock-feather (marigold), /workshops gets lotus (pichwai), /custom-orders gets mirror-diamond (vermillion), /contact gets rangoli-star (peacock). The visual register now ties each section's pigment to a tradition's motif.
- **Hero gets the first pigment wash** -- the home hero section is now `relative overflow-hidden` with a `<PigmentWash />` behind the headline + featured plate, so the inherited terracotta `--section-accent` glows into the top of the page. Subtle; doesn't compete with the artwork or the Devanagari flare.
- **About teaser uses `intensity="soft"`** -- the only home-page section with the stronger wash, so the marigold glow registers against the `bg-bg-soft` panel.
- **Each route's `<main>` becomes `relative`** so `<PigmentWash />` can sit absolutely behind the content; the `<header>` block becomes `relative` too so it lifts above the wash.

## 1.7.5 (2026-05-25)

Audit pass. Removes a dead dependency, unifies the hover register across every CTA card on the site, wires the last unused pigment into a section, and broadens the scroll bar's chromatic arc. No new visual ideas, no spec change -- this is the cleanup release before any further direction work.

### Changed

- **Workshops cards + home CTA pair now match the contact / artwork hover pattern** -- full transition list (`transform`, `border-color`, `box-shadow`), `-translate-y-0.5` lift, soft shadow, and the title tints to `--section-accent` instead of the global accent. The home Workshops CTA inherits pichwai, the Custom Orders CTA inherits vermillion, so both cards preview the pigment of the section they link into. Browse / Start a brief arrows now slide 4px right on hover with the same easing.
- **Gallery card hover ring inherits `--section-accent`** -- artwork cards on `/work` (ruby) ring deep red on hover, cards in any future section that sets a different pigment will tint to that pigment. Title underline + text tint already use `--section-accent`; the ring was the last hardcoded `accent` reference on the card.
- **Scroll-progress bar cycles all five pigments** -- vermillion -> marigold -> pichwai -> peacock -> ruby across the page width, replacing the three-stop ruby/marigold/peacock gradient. The bar now visually traverses the same chromatic arc the page does as you scroll.
- **`/work` index gets the ruby pigment** (the only token that was defined but never assigned). The catalog/archive register reads as a deeper collection-room red, distinct from the global terracotta on the home page. Eyebrow gains the same short rule as the home and contact pages so the section reads as part of the gallery register.

### Removed

- **`tw-animate-css` dependency + `@import "tw-animate-css"` in `globals.css`** -- repo-wide grep showed zero `animate-*` utility classes anywhere outside the import line. Dead dep; gone.

## 1.7.4 (2026-05-25)

Contact-page hierarchy + hover coordination. The page now visually backs the copy's promise that WhatsApp is the fastest reply, instead of treating all three channels as equal rows.

### Changed

- **WhatsApp promoted to a hero plate** -- bordered card with a larger 14/16 icon pellet, a peacock "Fastest reply" chip, the display number in `t-display 3xl/4xl`, and a one-liner explaining what to send. Lifts on hover (`-translate-y-0.5`) with a soft shadow and a peacock border, all in one 400ms ease-out-soft motion.
- **Instagram + Email step down to a 2-up grid** -- equal weight to each other, lighter than WhatsApp. Compact `t-display lg/xl` titles, smaller 11-unit pellets, same coordinated hover (lift + border + tint + arrow slide) as the hero card.
- **Coordinated hover** -- pellet ring, title color, and trailing arrow now move as one tinted unit, replacing the three independent transition-colors fades that the cards had before. Same unification approach as the artwork card pass.
- **Trailing arrow** -- replaced the literal `&rarr;` HTML entity with Lucide's `ArrowRight` icon for consistency with every other arrow on the site.
- **Eyebrow gets a peacock rule** -- matches the home-page numbered-eyebrow treatment so the contact section reads as part of the gallery register.

## 1.7.3 (2026-05-25)

Second polish pass. Card hover choreography, hero entrance, header indicator, numbered section eyebrows. All visual; no behaviour or data changes.

### Changed

- **Artwork card hover** -- the image plate now lifts by 2px, drops a soft shadow, and rings to `accent` in one coordinated 400ms motion (replacing the standalone ring transition). The title gets a left-to-right underline grown via animated `background-size`, and the chromacard swatch strip blooms from 8px to 10px tall. The eye reads one card as one moving unit instead of three independent fades.
- **Chromacard `groupHoverBloom` opt-in** -- the swatch strip now accepts a `groupHoverBloom` prop. The artwork card sets it; the artwork detail page leaves it off so the static palette caption doesn't move. Default is the pre-1.7.3 behaviour.
- **Hero Devanagari flare** -- a 1px accent rule grows in under the Devanagari core after the headline reveals. Implemented as a CSS-only `::after` keyframe so no extra JS lands on the LCP fold; respects `prefers-reduced-motion` (lands instantly at full width).
- **Hero featured caption** -- a small gallery-register caption ("Featured . N of 21") with an accent rule sits between the featured plate and the title row. Frames the piece editorially without competing with the headline.
- **Header active-route indicator** -- replaced the per-link static underline with a single Motion `layoutId` element that springs from old position to new on route change. One moving thing for the eye to track instead of two crossfading underlines.
- **Header scroll-shrink** -- once the user scrolls past 80px the header padding compresses from `py-3 / md:py-4` to `py-2 / md:py-2.5` over 400ms. Listener is rAF-throttled and reads `scrollY` directly (no Motion `useScroll` overhead since we only need a threshold).
- **Section eyebrows on home** -- "Selected work", "Available now", and "About" now read as `-- 01 / SELECTED WORK` style: a short rule in the section pigment, a numbered prefix in tabular nums, then the eyebrow text. The About teaser also gains its long-promised marigold `--section-accent`. Other pages keep the un-numbered eyebrow.

## 1.7.2 (2026-05-25)

UI polish pass driven by a multi-skill critique (emil-design-eng, make-interfaces-feel-better, 12-principles-of-animation, baseline-ui, fixing-motion-performance). All visual-only; no behaviour changes.

### Changed

- **Tactile press feedback** -- added `active:scale-[0.97]` to the `Button` cva base so every CTA acknowledges the tap; the two large home-page CTA cards (Workshops, Custom Orders) get a gentler `active:scale-[0.99]` so the surface feels pressed without overshooting.
- **Numeric prices use `tabular-nums`** -- artwork card and detail-page price lines now render with monospaced figures, so prices in a grid or rail line up regardless of digit width.
- **Type wrap roles** -- `.t-display` gets `text-wrap: balance` (so display headings break evenly instead of leaving an orphan word) and `.t-lead` gets `text-wrap: pretty` (so leads avoid widow lines on the last row). One CSS edit covers the home, work, about, workshops, custom-orders, and contact pages.
- **Reveal duration** dropped from 700ms to 500ms. The original timing felt cinematic but read as slow on a content-dense scroll; 500ms still lets the fade register without holding the reader up.
- **Hover-scale duration** on artwork cards and the hero featured image moved from `--duration-slow` (700ms) to `--duration-base` (400ms). Hover is feedback, not choreography -- 400ms lands inside the 200--400ms band where users feel the affordance instead of the animation.
- **Image-plate rings** switched from the warm-tinted `ring-line` token to neutral `ring-black/10 dark:ring-white/10` on the home featured plate, the artwork card grid, and the artwork detail plate. Lets the artwork's own colour story define the plate boundary instead of pulling page-chrome warmth into the frame. Hover/focus states still ring `accent`.

## 1.7.1 (2026-05-25)

PR #20 review-pass. Resilience, accessibility, and validation fixes uncovered by a multi-agent review of the 1.7.0 rebuild. No visual or behavioural changes on the happy path; failure paths now degrade gracefully.

### Fixed

- **Button corner radius** -- `rounded-md` was missing from the `Button` cva base. Pages used the right wrapper, but raw `<Button>` instances rendered with sharp corners. Added to base classes so radius is consistent everywhere.
- **No-`<a>`-inside-`<a>` nesting** -- replaced `<Link><Button>...</Button></Link>` patterns with `<Link className={buttonVariants({...})}>...</Link>` on home, contact, work-detail, and workshops pages. Same visual, valid HTML.
- **No-JS / SSR fallback for `Reveal`** -- elements rendered at `opacity:0` with no JS unhid them. Added a `<noscript>` style block in `app/layout.tsx` that forces `opacity:1` and `transform:none` for elements with the inline opacity-0 marker. Documented the accepted trade-off (Motion bundle load failure on JS clients) in the `Reveal` JSDoc.
- **Custom-order popup-blocker fallback** -- `window.open(...)` return value is now captured. If the browser blocks the popup, an inline `aria-live` error tells the user to use the email link instead. Form no longer silently does nothing.
- **`next/image` error fallback** -- new `<ArtImage>` client wrapper renders an `ImageOff` icon plate with the alt text as `aria-label` if the underlying request fails. Used on hero, gallery cards, and detail pages -- prevents broken-image icons from undermining the gallery.
- **Catalog shape validation** -- `lib/data.ts` now validates `data/artworks.json` on first read and throws a build-time error naming the offending slug if `items` is missing or any row lacks a required field. Replaces the previous "fail with `Cannot read properties of undefined`" runtime trap.
- **WhatsApp phone validation** -- `lib/whatsapp.ts` now asserts the phone is 10-15 digits and throws on malformed `wa.me` config URLs at build time. Configuration mistakes fail loud instead of producing dead links.

### Changed

- **Theme toggle pre-mount placeholder** uses canonical `w-30` instead of arbitrary `w-[7.5rem]`.
- **Work-page filter** announces filtered counts via an SR-only `aria-live="polite"` paragraph (instead of overloading the empty-state message). Removed the stray `aria-live` from the empty-state paragraph itself.
- **`marquee.css`** mask-image gradient uses `var(--color-ink)` instead of a raw `#000`, fixing the lone hex-in-CSS exception flagged by the review.
- **Smooth-scroll** failure path logs once via `console.warn` instead of silently swallowing the error -- a real Lenis-init bug now surfaces in dev tools.

### Documentation

- Clearer JSDoc on `app/work/page.tsx` (filter is JS-required; no-JS visitors see the unfiltered grid), `next.config.mjs` (named the GH Pages trailing-slash case), `theme-toggle.tsx` (why `system` mode clears the storage key), `artwork-card.tsx` (mentions the description preview), and `smooth-scroll.tsx` (failure-path logging contract).

## 1.7.0 (2026-05-24)

Full stack swap and frontend rebuild. The site moves from Vite + single-page anchor scroll to Next.js 15 with the App Router and statically exported routes. Catalog data is unchanged; the artwork images and `data/site.json` content carry forward as-is.

### Stack

- **Next.js 15 + React 19 + TypeScript strict + Tailwind 4 + Biome 2**, replacing the previous Vite SPA. Static export (`output: "export"`) keeps the GitHub Pages deploy path; `out/` replaces `dist/` as the build target.
- **Motion 12 + Lenis** for animation, lazy-loaded on first idle. `MotionConfig reducedMotion="user"` honours `prefers-reduced-motion` library-wide.
- **shadcn-style components** (Radix primitives via `class-variance-authority`), **lucide-react** for UI icons, **react-icons/si** for brand glyphs (WhatsApp, Instagram, Gmail).
- **next/font/google** self-hosts Cormorant Garamond, Inter, Tiro Devanagari Hindi at build. No CDN font calls.

### Routes

- `/` (home): hero with character-entrance description, marquee band, Selected Work rail, Available Now rail (renders only when at least one piece has `priceInr`), About teaser, Workshops + Custom Orders CTA pair.
- `/work`: 21-piece gallery with style filter (All / Madhubani / Pichwai / Lippan / Gond / Texture / Mixed Media), uniform 3:4 cards, palette swatches and description preview per card.
- `/work/[slug]`: 21 statically generated detail pages with full image, metadata stack (medium / year / dimensions / status / price / palette), description, "Enquire on WhatsApp" CTA, prev/next nav.
- `/about`: paragraphs with drop-cap on the first, marigold pull-quote with side bar, Devanagari iti article-end mark, "Based in" + "Open to" aside cards.
- `/workshops`: card grid driven by `workshops[]`, duration pills, per-card WhatsApp enquire link, group/school enquiry CTA.
- `/custom-orders`: 3-step "How it works" rail + form with name / preferred style / approx size / budget / timeline / brief. Submit opens WhatsApp with a pre-filled message; an email fallback link appears after submit.
- `/contact`: three big channel rows (WhatsApp / Instagram / Gmail) with brand glyphs, monumental hover, custom-orders CTA card.

### Data seam

- New [`lib/data.ts`](lib/data.ts) is the single source the UI imports through. Today it reads `data/*.json`; in Phase 2 it will switch to a database query without touching any other file.
- Catalog moved from `src/data/` to repo-root `data/` so it survives stack swaps cleanly.
- New [`lib/site-config.ts`](lib/site-config.ts) holds `siteConfig.url` / `basePath` / `prodUrl`. `next.config.mjs` mirrors `basePath` as a literal because Next config files cannot import `.ts` at config-load.
- New [`lib/whatsapp.ts`](lib/whatsapp.ts) builds wa.me deep links and the email fallback `mailto:` URL from a typed `CustomOrderDraft`.

### Theme

- 3-state theme toggle (Light / Dark / System) persisted to `localStorage`. Pre-paint script in `app/layout.tsx` resolves the chosen theme before first paint to avoid FOUC.
- Section pigment accents wired across pages: about=marigold, workshops=pichwai, custom-orders=vermillion, contact=peacock. Hero + Selected Work inherit the global terracotta accent. Drop-cap, pull-quote borders, hover states, accent links all derive from `--section-accent`.
- Subtle, consistent corner radius (`rounded-md`) applied to every surface (cards, panels, fields, buttons, image plates). Pills and the theme toggle keep `rounded-full`.

### Motion

- Refined fade-up reveal on scroll (Motion 12), capped stagger so longer lists do not feel theatrical.
- Hero description uses character-entrance via a small `SplitText` (8px lift, 12ms per-character stagger).
- Lenis smooth scroll bootstrapped lazily on first idle. Bails out under `prefers-reduced-motion`. Failures (ad blocker, network blip) silently fall back to native scroll.
- Tri-color scroll-progress bar fixed at the top of the viewport. Marquee band of artwork titles + Devanagari words between hero and Selected Work, pure CSS animation, pauses on hover.
- Locked exclusions: no 3D tilt on cards, no decorative backdrops (mesh / lattice / particle / orbit / floating-shapes), no custom cursor. Earlier attempts read as busy.

### Bug fixes

- React hydration mismatch in motion components removed by hoisting reduced-motion handling to the library level instead of branching at the component.
- `mrgayugma.aspectRatio` corrected from 0.77 to 0.73 to match the source image's real pixel ratio.
- Next 15.5 in-app DevTools panel was crashing HMR on Windows + pnpm with `__webpack_modules__[moduleId] is not a function`. Disabled via `devIndicators: false` in `next.config.mjs`.

### Conventions

- **Mobile-first**: most traffic arrives from WhatsApp / Instagram link-taps. Pages are designed for phone width primarily.
- **No literal `--` in user-facing copy** (page metadata, JSX strings, dropdown options, `data/*.json`). Replace with comma / period / colon / parentheses, or restructure. Internal code comments are exempt.
- **CHANGELOG.md is updated on every PR**. Bump version in `package.json` to match.
- 500-line file ceiling. No raw hex / rgb in components (CSS variables only). No magic timings (named tokens only).

### Documentation

- `CLAUDE.md` rewritten to describe the current stack and rules, including the no-double-dash rule and the changelog rule.
- `MEMORY.md` "Current state on disk" lists every page that's actually built. Confirmed-decisions table picks up the new locked rules (motion exclusions, corner radius, section accents, no-double-dash).

### Verification

`pnpm typecheck` + `pnpm lint` + `pnpm build` all clean. 30 static pages generated, 21 of them via `generateStaticParams` for `/work/[slug]`. First Load JS: home 150 kB, /about 142, /workshops 142, /contact 145, /custom-orders 151, /work 159, /work/[slug] 150.

## 1.6.0 -- 2026-05-24

Custom domain. Site is now served from the apex `kalchar.co.in` (client-owned), no longer from the GH Pages subpath at `sagargupta.online/folk-art-portfolio/`. Single-env deploy: only `main` ships to prod; `dev` is local-only (GH Pages allows one custom domain per repo, so a public `/beta/` URL isn't possible without a second repo).

### Domain

- **`public/CNAME`** added with `kalchar.co.in`. Tells GitHub Pages to serve the build at the apex.
- **[`scripts/site-config.mjs`](scripts/site-config.mjs)** swaps `SITE` from `https://sagargupta.online` to `https://kalchar.co.in` and `BASE` from `/folk-art-portfolio/` to `/`. Every URL in the build (canonical, OG, Twitter, sitemap entries, JSON-LD `@id`s and image fields) flows from these two constants.
- **`vite.config.ts`** SEO plugin loses the `IS_BETA` switch and the canonical/robots beta-rewrite block -- there is no beta build anymore.
- **`index.html`** static fallback meta tags (canonical, og:url, og:image, twitter:image, favicon, apple-touch-icon) updated to absolute `https://kalchar.co.in/` URLs and root-relative `/logo.jpg` / `/logo-180.png` paths. The build-time SEO plugin still overwrites the dynamic ones; these are what someone sees if they open the file without running a build.
- **`public/robots.txt`** sitemap URL updated to `https://kalchar.co.in/sitemap.xml`.

### Deploy

- **[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)** rewritten as a single-checkout, single-build, main-only deploy. The previous combined-dist workflow that built both `main` and `dev` into one artifact (with `dev` at `/beta/`) is gone -- one custom domain means one build.

### Documentation

- **README.md** -- live URL collapsed from three (prod, beta, mirror) to one (`https://kalchar.co.in/`). Beta references removed from SEO and Branching sections. Dev URL updated to `http://localhost:5173/`.
- **CLAUDE.md** -- Stack/Run/Deploy/Gotchas/Branching sections aligned with the apex domain. Branching table now shows one deploy target.
- **MEMORY.md** -- locked-decisions table gains a Custom domain row, the two-env-deploy row becomes single-env-deploy, and the pending Custom-domain item is removed.

### Verification

`pnpm typecheck` + `pnpm build` clean. `dist/index.html` carries `https://kalchar.co.in/` in canonical, og:url, og:image, twitter:image, and the JSON-LD graph (`@id`s and `image` URLs throughout). `dist/sitemap.xml` lists `https://kalchar.co.in/` plus each section anchor. `dist/CNAME` ships verbatim.

### Migration

Out-of-band, by Sagar at the registrar: 4 A records on the apex pointing to GitHub Pages (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`), `www` CNAME to `sagargupta16.github.io`, then add the custom domain in repo Settings -> Pages and enable HTTPS.

## 1.5.1 -- 2026-05-23

Code-quality patch on top of 1.5.0. No behavior change, no bundle-size change. Targets the kind of smell SonarQube would flag: stringly-typed duplication, vestigial type coercion, unhandled promise paths, anti-pattern React keys, and DRY violations between build scripts.

### Refactors

- **Centralized feature detection.** `"(prefers-reduced-motion: reduce)"`, `"(hover: none)"`, and `"(pointer: coarse)"` were inlined as raw strings in 9 files (App, Hero, CustomCursor, ImageReveal, ParticleField, SplitText, useMagnetic, useScrollParallax, useTilt3D). New [`src/lib/media.ts`](src/lib/media.ts) exposes `prefersReducedMotion()`, `isTouchOnly()`, `hasCoarsePointer()`, and a combined `prefersNoFancyMotion()`. SSR-safe (return false when `window` is undefined). Every consumer now imports from one place.
- **Typed catalog/workshops re-exports.** `(artworksData.items as Artwork[])` and `(siteData.workshops as Workshop[])` were duplicated across 4 files. [`src/lib/site.ts`](src/lib/site.ts) now exposes `artworks: readonly Artwork[]` and `workshops: readonly Workshop[]`, both pre-sorted by `order`. The `Workshop` type is promoted from local-to-Workshops.tsx to a public export. Hero, Work, Marquee, Workshops drop their casts.
- **`as unknown as` cast removal in App.tsx.** `requestIdleCallback` and `cancelIdleCallback` were typed via `window as unknown as { requestIdleCallback?: ... }` -- a defensive workaround for a missing lib type. Both signatures have lived in `lib.dom.d.ts` since TypeScript 4. Now uses `typeof window.requestIdleCallback === "function"` for a clean feature check, no coercion.
- **Lenis import error swallowed cleanly.** The dynamic `await import("lenis")` was invoked fire-and-forget inside the idle callback, so any rejection (network blip, ad blocker, MIME-type issue) surfaced as an unhandled-rejection console error. Now wrapped in a `kickoff` shim that calls `start().catch(() => {})` -- smooth scroll is purely cosmetic, native scroll is the right fallback.
- **Stable React keys.** Five components used array-index keys where the underlying content has a natural identity:
  - `Marquee.tsx`: `key={item.text}` (titles + Devanagari ornaments are unique strings).
  - `ArtworkLightbox.tsx` + `Chromacard.tsx`: `key={hex}` (palette swatches are guaranteed-distinct hex codes per artwork).
  - `About.tsx`: `key={p.slice(0, 24)}` (paragraph prefix is stable and unique).
  - `SplitText.tsx`: kept index-based but composed as `key={`${i}-${char}`}` -- for character splits, position genuinely IS the identity (the same letter recurs and animation order is what we tween). Comment added so the choice is explicit.
- **Shared scripts site-config.** `SITE`, `REPO_NAME`, `BASE`, and `PROD_URL` were duplicated between [`vite.config.ts`](vite.config.ts) and [`scripts/generate-sitemap.mjs`](scripts/generate-sitemap.mjs). New [`scripts/site-config.mjs`](scripts/site-config.mjs) is the single source of truth -- ESM `.mjs` so Node can run it directly and the TS config can import via Vite's resolver. When the artist's domain lands, change one file.

### Verification

`pnpm lint` + `pnpm typecheck` + `pnpm build` all clean. Bundle output identical to 1.5.0: 245.17 kB main, 18.83 kB Lenis chunk (deferred), 5 decorative chunks under 2.3 kB each. `dist/index.html` 13.24 kB with full SEO injection. `dist/sitemap.xml` 6 entries.

## 1.5.0 -- 2026-05-22

Post-migration audit pass. The 1.4.0 Astro -> Vite move shipped fast and left some debt: docs claiming features the new stack didn't have, no sitemap, JSON-LD only client-rendered, decoratives loaded eagerly, no lint config. This release closes the gap between what the README promises and what the build actually ships.

### Documentation sync

- **README.md** rewritten end-to-end. The previous version still described Astro 6, content collections, `BaseLayout.astro`, `astro.config.mjs`, `@astrojs/sitemap`, and "zero JS by default" -- none of which exist in the current build. New version's stack table reflects Vite 6 + React 19 + Tailwind 4 + Biome 2; SEO section describes the build-time plugin; quick-start lists the new lint/format scripts.
- **MEMORY.md** locked-decisions table: stack row dated 2026-05-22 (Vite SPA, not Astro 6 islands); two-env-deploy row references `vite.config.ts` and the SEO plugin instead of `BaseLayout.astro`; new lint row for Biome 2.
- **CLAUDE.md** lower half: every reference to `astro.config.mjs`, `BaseLayout.astro`, and `src/lib/structured-data.tsx` swapped for the Vite-plugin reality. `generate-sitemap.mjs` added to the file index.
- **`src/data/artworks.json`** `_notes` and **`.claude/skills/new-artwork/SKILL.md`** stop pointing at a Zod schema in `src/content.config.ts` (file doesn't exist) and point at the `Artwork` TS type in [`src/lib/images.ts`](src/lib/images.ts) instead.
- **`public/robots.txt`** sitemap URL switches from `sitemap-index.xml` (the old Astro output filename) to `sitemap.xml`; comment switches from "@astrojs/sitemap" to `scripts/generate-sitemap.mjs`.

### SEO

The single biggest user-visible regression from 1.4.0. The static `index.html` shipped to GitHub Pages had no description, no OG, no Twitter card, no canonical, no sitemap, and the JSON-LD only rendered client-side via React. Now everything crawlers need is in the static document on first byte.

- **`index.html`** carries hand-written `<meta name="description">`, full Open Graph (`og:type`, `og:title`, `og:description`, `og:url`, `og:image`, `og:locale`, `og:site_name`), Twitter Card (`summary_large_image`), `<link rel="canonical">`, `<meta name="robots" content="index, follow">`. A `<!--seo-injection-marker-->` comment in `<head>` is where the build splices the dynamic bits.
- **Custom Vite plugin** `seoPlugin` in [`vite.config.ts`](vite.config.ts) runs in `transformIndexHtml(order: 'pre')`. Reads [`src/data/site.json`](src/data/site.json) and [`src/data/artworks.json`](src/data/artworks.json) and emits:
  - **JSON-LD graph**: `Person` / `VisualArtist` + `WebSite` + one `VisualArtwork` per catalog entry, single `<script type="application/ld+json">` in `<head>`.
  - **Hero preload**: `<link rel="preload" as="image" type="image/webp" imagesrcset="... 800w, ... 1200w" imagesizes="..." fetchpriority="high">` for the featured artwork's WebP variants. The LCP candidate gets fetched before the JS bundle parses.
  - **Beta noindex**: when `DEPLOY_ENV=beta`, rewrites `<meta name="robots">` to `noindex, nofollow` and the canonical to the prod URL so SEO consolidates at `sagargupta.online/folk-art-portfolio/`.
- **Sitemap**. New [`scripts/generate-sitemap.mjs`](scripts/generate-sitemap.mjs) emits `dist/sitemap.xml` with the homepage plus each section anchor (`#work`, `#about`, `#workshops`, `#custom-orders`, `#contact`). Skipped on beta. Wired as the last step of `pnpm build`.
- **`src/lib/structured-data.tsx` deleted.** Was a `dangerouslySetInnerHTML` JSON-LD component rendered inside `<App>`. The static-head version is strictly better; shipping both would duplicate the graph.

### Performance

Main JS bundle drops from 267 kB to 245 kB; another ~25 kB of decorative code now lives in lazy chunks that hydrate after the page is interactive.

- **Decoratives lazy-loaded**. `CustomCursor`, `NoiseOverlay`, `ParticleField`, `Lattice3D`, `FloatingShapes` are all `React.lazy()` chunks behind `<Suspense fallback={null}>` boundaries. They're pure ambient chrome -- the page is fully usable without them, so a `null` fallback is correct.
- **Lenis dynamic-imported on idle**. Smooth scroll runs through `requestIdleCallback` (200 ms `setTimeout` fallback). The 18.83 kB Lenis bundle no longer blocks the hero paint. Reduce-motion users skip it entirely as before.
- **ParticleField pauses offscreen**. New `IntersectionObserver` on the canvas toggles a `running` flag; the RAF loop early-returns when offscreen and reattaches when back. The O(n^2) connection-distance sweep over 60 particles every frame previously kept running while the user scrolled the rest of the site -- real battery cost on mobile.
- **Hero preload link** in `<head>` (see SEO section) -- the LCP candidate is fetched before JS parses, not after.

Final build output:

```
index-*.js          245.19 kB (gzip 76.29 kB)  -- main bundle
lenis-*.js           18.83 kB (gzip  5.36 kB)  -- deferred to idle
ParticleField.js      2.26 kB
CustomCursor.js       1.98 kB
Lattice3D.js          0.76 kB
NoiseOverlay.js       0.54 kB
FloatingShapes.js     0.26 kB
```

### Accessibility

Three small but real regressions caught in the audit.

- **`CustomCursor` no longer leaves orphan divs on touch.** Was returning early from its `useEffect` on `(hover: none)` / `prefers-reduced-motion: reduce` but still rendered the two cursor-and-follower `<div>`s, leaving them as empty positioned ringlets at top-0/left-0 of the viewport on phones. Now gates on `(hover: none) || (pointer: coarse) || prefers-reduced-motion` and `return null` from the component before the JSX.
- **`Marquee` no longer announces itself to screen readers.** Was `aria-label="Featured artworks"` with one of two duplicated tracks set to `aria-hidden="false"`, so AT read all 14 titles + 7 Devanagari ornaments on every page load as a live region. The same titles live in the gallery below; the marquee is pure decoration. Now the entire `<aside>` is `aria-hidden="true"`.
- **`ScrollProgress` is `aria-hidden` and `pointer-events-none`**. Previously a plain `z-50` div with no a11y semantics, capable of intercepting clicks at the top edge of the viewport.
- **`ArtworkLightbox` close/prev/next icons** marked `aria-hidden="true"` -- the parent buttons already carry `aria-label`, so the SVGs were doubling up the announcement.

### Tooling

- **Biome 2 config** at [`biome.json`](biome.json). Tab indent (matches existing TSX), double quotes, 100-col line width, trailing commas, organize-imports on save. CSS files excluded from the include glob because Tailwind 4's `@custom-variant` / `@theme` directives confuse Biome's CSS parser. `useKeyWithClickEvents` and `useSemanticElements` off (the existing `role="group"` filter group on `Work.tsx` is intentional).
- **`pnpm lint` / `pnpm lint:fix` / `pnpm format` scripts** added to [`package.json`](package.json).
- **CI runs lint** -- new step in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) before typecheck. Job renamed to "lint, typecheck and build".
- **Tree reformatted** by `biome check --write`. Mostly cosmetic (organize imports, JSX collapses where it fits in 100 cols, drop trailing whitespace, double-quote the inline theme script). Real fixes folded in: `App.tsx` `forEach` callbacks now have brace bodies (no implicit return), `vite.config.ts` uses `node:path` protocol, `index.html` inline theme script uses `let` / `const` instead of `var`-in-`try`.

### Stack

No runtime changes -- React 19, Vite 6, Tailwind 4, TypeScript 6 strict, lenis 1.3.23, sharp 0.34.5, fontsource for Cormorant Garamond / Inter / Tiro Devanagari Hindi all unchanged. Biome 2.4.15 was already in devDeps; this release just adds the config and CI step that activate it.

## 1.4.0 -- 2026-05-22

Full framework migration from Astro 6 to Vite + React 19. The site is now a single-page React application instead of an Astro static site. Same design system, same CSS, same image pipeline, same deploy target -- the rendering layer moved from server-rendered Astro templates to client-rendered TSX components.

### Stack change

- **Astro 6 removed.** All `.astro` files, `astro.config.mjs`, content collections (`src/content.config.ts`), and Astro dependencies (`@astrojs/check`, `@astrojs/react`, `@astrojs/sitemap`, `astro`) deleted.
- **Vite 6 + React 19** replaces the Astro build. `vite.config.ts` configures the same `base` path logic (env-driven `DEPLOY_ENV=beta` for staging). `@vitejs/plugin-react` handles JSX transform.
- **TypeScript 6** strict mode via `tsconfig.json` (no longer extends `astro/tsconfigs/strict`). `baseUrl` removed (deprecated in TS 6); `paths` uses `./src/*` form.
- **Index HTML** at repo root. Theme-detection script runs inline before React hydrates, preventing FOUC.
- **`src/main.tsx`** mounts the React tree into `#root`. `src/App.tsx` composes layout + sections.

### Architecture changes

- **Reveal observer** moved from a detached `<script is:inline>` to a `useEffect` hook in `App.tsx`. Same IntersectionObserver logic, now runs after React mount.
- **Gallery filter** moved from a vanilla JS `<script is:inline>` to React state (`useState` in `Work.tsx`). Filter controls re-render the visible items list; no DOM display-toggling.
- **Lightbox** moved from imperative DOM manipulation of a single `<dialog>` to a React-controlled `<dialog>` component (`ArtworkLightbox.tsx`). Open/close/navigation driven by state. Arrow-key listeners via `useEffect`.
- **Hero parallax** moved to a `useEffect` + `useRef` hook in `Hero.tsx`. Same rAF-coalesced transform logic.
- **Structured data (JSON-LD)** is now a React component (`StructuredData`) rendering a `<script type="application/ld+json">` via `dangerouslySetInnerHTML`.
- **Icons** consolidated from three `.astro` files into one `icons.tsx` exporting `Instagram`, `Whatsapp`, `Mail` as React components.

### What's preserved

- **CSS unchanged.** `globals.css` and `motion.css` remain the same. All theme tokens, animation keyframes, card/gallery/chromacard/lightbox styles work identically.
- **Data unchanged.** `src/data/artworks.json` and `src/data/site.json` remain the sole sources of truth. No content model changes.
- **Image pipeline unchanged.** `scripts/optimize-images.mjs` still runs at build time. `ArtworkImage.tsx` emits the same `<picture>` with AVIF/WebP `<source>` chains.
- **Deploy unchanged.** CI + deploy workflows still call `pnpm typecheck` / `pnpm build`. Vite outputs to `dist/` with the same base-path structure. GitHub Pages combined-dist workflow works without modification.

### Tradeoff

- **Bundle size up.** Astro shipped ~5 KB of JS (only islands). Vite+React ships ~75 KB gzipped (React runtime + full app). Acceptable for a portfolio with interactive filter/lightbox -- the client rendering unlocks smoother state transitions.
- **No sitemap.** `@astrojs/sitemap` integration removed. A static `sitemap.xml` can be added to `public/` if needed; or a Vite plugin can generate one at build time.

## 1.3.0 -- 2026-05-22

Colorful redesign. Site now leans into authentic Madhubani saturation -- ruby, marigold, peacock, indigo, neem -- so the chrome agrees with the work instead of softening it. Each piece carries its own 3-5 swatch palette, drives a chromacard caption + card-hover halo, and tints its style label. Motion budget grew (BlurFade reveals, kinetic Devanagari, aurora backdrop, hero halo, marquee band, native `<dialog>` lightbox) but stays pure CSS -- zero new React islands. All animations honor `prefers-reduced-motion`.

### Color identity

- **Madhubani palette tokens** in [`globals.css`](src/styles/globals.css). Eight saturated pigments (ruby/marigold/peacock/indigo/vermillion/neem/ochre/plum) with light + dark variants. Per-style accents bumped from muted to authentic (Madhubani -> ruby, Pichwai -> jade, Lippan -> ochre, Gond -> indigo, Texture -> terracotta, Mixed -> plum).
- **Per-artwork palette field.** [`src/content.config.ts`](src/content.config.ts) adds `palette: string[3..5]` (hex regex). [`src/data/artworks.json`](src/data/artworks.json) seeded for all 21 pieces with hand-picked swatches drawn from each painting.
- **Chromacard component** at [`src/components/ui/Chromacard.astro`](src/components/ui/Chromacard.astro). Zero-JS swatch strip (museum palette caption) under each gallery card and inside the lightbox aside.
- **Section accent cascade.** [`Section.astro`](src/components/layout/Section.astro) accepts an `accent` prop, sets `--section-accent` inline, drives the eyebrow tint and underline-grow on the section heading.
- **Per-card hover halo.** [`Work.astro`](src/components/sections/Work.astro) sets `--card-accent` per `<li>` from a style -> color map, so a Pichwai card glows jade-green on hover and a Madhubani card glows ruby. Filter pills paint in the same accent when active.

### Motion

- **BlurFade reveals.** `.reveal` upgraded to `filter: blur(6px) -> blur(0)` alongside opacity + translateY. Magic UI vocabulary, pure CSS.
- **Kinetic Devanagari.** Hero accent character animates a slow gradient shift through ruby -> marigold -> peacock. `.kinetic-devanagari` in [`globals.css`](src/styles/globals.css).
- **Aurora backdrop** behind the hero -- two slow-drifting saturated radial blobs via filter blur. Used sparingly (hero only).
- **Hero halo.** [`Hero.astro`](src/components/sections/Hero.astro) reads the featured artwork's first palette swatch into `--hero-halo`, painting a soft radial pulse behind the parallax frame. Reads as the painting's own light spilling out.
- **Marquee band** between Hero and Work. New [`src/components/ui/Marquee.astro`](src/components/ui/Marquee.astro) interleaves 14 artwork titles with 7 Devanagari ornaments (कमल / मृग / गाय / मीन / मोर / वृक्ष / सरिता) on a doubled track for a seamless CSS-only loop. Pauses on hover.

### Lightbox

- **Native `<dialog>` lightbox** at [`src/components/ui/ArtworkLightbox.astro`](src/components/ui/ArtworkLightbox.astro). Zero dependencies -- the browser handles focus trap, ESC-to-close, and the `::backdrop` pseudo-element gives us a styled overlay for free. Single dialog in the DOM regardless of catalog size.
- **Gallery cards as triggers.** Each `<li>` in [`Work.astro`](src/components/sections/Work.astro) is now a `<button data-lightbox-trigger>` carrying the artwork's full payload (slug, title, style, medium, year, description, alt, AVIF + WebP srcsets, palette, accent) on data-attributes. Click delegation in the lightbox script reads the payload and paints content on demand.
- **Filter-aware navigation.** Prev/next buttons and ArrowLeft/ArrowRight cycle through siblings sharing the gallery's current filter -- a Madhubani filter restricts navigation to Madhubani pieces.
- **Reuses image variants.** Lightbox `<picture>` builds AVIF + WebP `<source>` chains dynamically from the same 800/1200 wide variants the optimize-images script already generates. No extra build step, no new request types.

### Section pigment + delight pass

- **Hero rework.** [`Hero.astro`](src/components/sections/Hero.astro) gains an animated grid backdrop (radial-masked, slow drift) layered above the aurora, plus a scroll-cue link with a pulsing line and "scroll" eyebrow that anchors to `#work`.
- **Workshops glow-up.** [`Workshops.astro`](src/components/sections/Workshops.astro) sets `accent="var(--style-pichwai)"`, replaces flat cards with `card-tilt` + `border-beam`. Cards lift on hover with a subtle perspective tilt; a conic-gradient beam rotates around the border (mask-composite trick, pure CSS). Duration chips and "Enquire" links paint in the section accent.
- **CustomOrders glow-up.** [`CustomOrders.astro`](src/components/sections/CustomOrders.astro) sets `accent="var(--color-vermillion)"` so the form heading, label tints, submit button, and confetti burst all inherit the warm vermillion automatically.
- **About ornate frame.** [`About.astro`](src/components/sections/About.astro) sets `accent="var(--color-marigold)"`. First paragraph gets a `.drop-cap` initial in italic display serif. Pull-quote uses the section accent for both the left rule and the quote text. A Devanagari "इति" (closing flourish from classical manuscripts) signs off the bio in muted accent ink, marked `aria-hidden`.
- **Contact peacock pass.** [`Contact.astro`](src/components/sections/Contact.astro) sets `accent="var(--color-peacock)"`. Each contact row's icon, label, and address shift to the section accent on hover.
- **OrderForm submit + celebration.** [`OrderForm.tsx`](src/components/ui/OrderForm.tsx) submit button now paints in `var(--section-accent)` (saturated vermillion, no longer flat ink). On submit, a CSS-only confetti burst of eight pigment-colored spans bursts behind the button; state resets after 1200ms so a second submit re-fires.
- **Motion split.** [`globals.css`](src/styles/globals.css) shrunk from 559 lines to 348 by extracting all motion utilities (reveal, stagger, aurora, kinetic-devanagari, marquee, parallax-frame, hero-halo, ken-burns, plus the new card-tilt, border-beam, drop-cap, scroll-cue, hero-grid, celebrate-burst) into [`src/styles/motion.css`](src/styles/motion.css) and importing back. Keeps every source file under the 500-line ceiling.

### Mobile + motion legibility pass

- **2-up gallery on phones.** [`Work.astro`](src/components/sections/Work.astro) drops from a 1-column wall-of-thumbnails into `grid-cols-2` at base. Card title/style sizing tightens at small breakpoints; secondary "medium · year" line hides under `sm` so cards stay scannable in a tight 2-up.
- **Beefier reveal motion.** `.reveal` displacement bumped from 18px to 28px and blur from 6px to 10px so BlurFade is unmistakable at thumb-distance, not just a CSS-curiosity. Stagger steps widened to 90ms so each child entry registers separately.
- **Always-on accent ring.** [`motion.css`](src/styles/motion.css) `.border-beam` was hover-only -- mobile users (no hover) never saw it. Now every `.border-beam` card carries a quiet 1px outline tinted in the section accent at rest; the rotating conic beam sweep layers in via `::after` only on hover/focus. Mobile users see pigment, hover users see motion.
- **Card-shadow breathe on touch.** [`motion.css`](src/styles/motion.css) on `(hover: none)`, `.card-tilt` runs a 7s shadow alternate (no transform) so cards visibly inhale/exhale without misaligning the beam ring. Even-indexed cards offset by half-period so siblings breathe out of phase.
- **Brighter hero halo on mobile.** [`motion.css`](src/styles/motion.css) `.hero-halo::before` opacity 0.45 -> 0.6, period 8s -> 6s under `768px`. The hero-frame parallax tilt is hover-gated, so on phones the halo is the primary motion of the hero plate; this makes it visible.
- **Form fields meet iOS / touch-target rules.** [`globals.css`](src/styles/globals.css) bumps `.field-input/.field-select/.field-textarea` to 1rem (16px, kills iOS auto-zoom on focus) and a 48px min-height. [`OrderForm.tsx`](src/components/ui/OrderForm.tsx) submit button `min-h-[48px]`, fallback email link `min-h-[44px]` -- both hit Apple HIG / Material touch-target floors.
- **Mobile nav fits in 5.** [`Header.astro`](src/components/layout/Header.astro) swaps the horizontal-scroll mobile nav for a 2-row flex-wrap that fits all 5 nav items at 375px without sideways scroll. Each link min-height 40px for thumb comfort.
- **Hero chip row tightens at base.** [`Hero.astro`](src/components/sections/Hero.astro) style chips drop to `text-[0.65rem]` and `px-2.5` on mobile so all 6 styles fit in two rows without wrapping awkwardly.
- **Filter pills hit 40px** ([`Work.astro`](src/components/sections/Work.astro)).
- **Scroll-cue desktop-only.** [`motion.css`](src/styles/motion.css) `.scroll-cue` hidden under 768px -- it overlapped the artwork plate on phones and the kinetic typography is enough cue.

### Hover-free, content-first pass

Hover is unreliable on touch (iOS fires a synthetic hover on first tap, the user has to "fight" the interface to read content), so any **content** previously gated behind hover is now always visible. Hover may still embellish (link color shifts) but no longer hides anything.

- **Artwork descriptions inline.** [`Work.astro`](src/components/sections/Work.astro) moved each piece's description out of the bottom-overlay slide-up (which only fired on `:hover`) into a static `<p>` below the title. Every artwork already had a description in [`artworks.json`](src/data/artworks.json) -- they just weren't visible to phone users.
- **Image scale removed.** Gallery images no longer `group-hover:scale-[1.02]` -- pointer users see the same crisp render as touch users, no shifting frames mid-tap.
- **Card-tilt static.** [`motion.css`](src/styles/motion.css) `.card-tilt` no longer applies `perspective(900px) rotateX(2deg) rotateY(-2deg) translateY(-4px)` on hover. Replaced with a static section-accent shadow at rest (`0 12px 28px -22px ...`). Touch + pointer get identical surfaces.
- **Border-beam static ring.** `.border-beam::after` rotating conic sweep removed entirely. Only the always-on `::before` 1px accent outline remains; opacity bumped from 45% to 55% so the pigment identity is clearer at rest.
- **Hero parallax kept hover-only** (script already early-returns on `(hover: none)`) -- it's pure embellishment that adds nothing on touch and would fight the kenburns motion if forced on.

### Minimal-motion pass

Cut overlapping ambient loops so each remaining animation reads as intentional, not noise. Final motion vocabulary:

- **Hero text zone:** `kinetic-shift` on the Devanagari word (slowed 12s -> 18s).
- **Hero artwork:** `kenburns` breathe (slowed 22s -> 28s, displacement 6% -> 4%).
- **Marquee band:** `marquee-scroll` (unchanged -- explicit feature).
- **Hover-only:** `border-beam` rotation, card-tilt perspective lift.
- **Event-only:** `confetti-pop` on form-submit success.

Killed the always-on loops that competed with the above: aurora drift, hero-grid drift, scroll-cue pulse, hero-halo pulse, and the touch-only card-float breathe. Each killed effect is replaced with a static rendering of the same shape (aurora as still color, grid as still lattice, halo as still glow, scroll cue at fixed 0.6 opacity). Reveal-on-scroll calmed from translateY 28px / blur 10px / 850ms to 16px / 4px / 600ms; stagger steps tightened from 90ms to 60ms.

## 1.2.0 -- 2026-05-22

Two-environment setup. `main` continues to ship prod at `/folk-art-portfolio/`; new `dev` branch ships a staging mirror at `/folk-art-portfolio/beta/`. Promotion flow is now `feat/<topic>` -> `dev` (auto-deploys to `/beta/`) -> `main` (auto-deploys to prod), so changes can be verified on a real URL before reaching prod.

### Deploy

- **Env-driven base path** in [`astro.config.mjs`](astro.config.mjs). `DEPLOY_ENV=beta` switches `base` from `/folk-art-portfolio/` to `/folk-art-portfolio/beta/`. The canonical origin (`https://sagargupta.online`) stays the same in both builds.
- **Combined-dist workflow** in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). On any push to `main` or `dev`, the job checks out both branches, builds prod into the root and beta into `/beta/`, combines into a single artifact, and deploys via OIDC. Guarantees prod and beta never drift -- every deploy reflects current state of both branches.
- **CI** now triggers on push and PR for both `main` and `dev` ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

### SEO hygiene on beta

- **`<meta name="robots" content="noindex, nofollow">`** emitted on beta builds in [`BaseLayout.astro`](src/layouts/BaseLayout.astro). Prevents `/beta/` competing with prod for the same content in search results.
- **Canonical rewrite.** Beta pages emit `<link rel="canonical">` pointing at the prod equivalent (e.g. `/folk-art-portfolio/beta/` -> `/folk-art-portfolio/`). Any inbound link to a beta URL still consolidates ranking signals at prod.

### Branch protection

- `main` -- PR-only, CI must pass before merge. Direct push and force-push blocked.
- `dev` -- unprotected (solo workflow, fast iteration). CI still runs but doesn't gate.

### Documentation

- [`CLAUDE.md`](CLAUDE.md) "Branching and releases" rewritten to describe the two-branch flow and `DEPLOY_ENV` mechanics.
- [`README.md`](README.md) lists prod + beta + mirror URLs and the promotion flow.
- [`MEMORY.md`](MEMORY.md) records the two-env deploy decision and the protection posture.

## 1.1.0 -- 2026-05-17

Discoverability + performance pass. Site now ships with build-time image optimization, full SEO infrastructure (sitemap, structured data, share-card metadata, canonical URL), and a handful of code-health and accessibility improvements. No content changes; the artwork catalog is unchanged at 21 pieces.

### Discoverability (SEO)

- **Open Graph metadata** in [`src/layouts/BaseLayout.astro`](src/layouts/BaseLayout.astro). WhatsApp link previews, Instagram DM previews, mail-client previews now render a card with title, description, and image instead of a bare URL.
- **Canonical URL** emitted on every page. `astro.config.mjs` `site` now points at the primary domain (`https://sagargupta.online`) via a single `SITE` constant; the GitHub Pages mirror at `Sagargupta16.github.io` continues to serve the same build but search engines are told to consolidate ranking signals at the primary domain.
- **Sitemap + robots.txt.** [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/) auto-generates `sitemap-index.xml` + `sitemap-0.xml` at build. [`public/robots.txt`](public/robots.txt) allows all crawlers and points at the canonical sitemap.
- **JSON-LD structured data** via new [`src/lib/structured-data.ts`](src/lib/structured-data.ts) helper. Each homepage build emits a 23-entity `@graph`: 1 `Person` + `VisualArtist` (artist with `sameAs` → Instagram + WhatsApp, `knowsAbout` for each folk-art tradition, address in IN), 1 `WebSite`, 21 `VisualArtwork` entries (one per piece, with `artform`, `artMedium`, absolute image URL, and `creator` reference).
- **Image alt text** in [`Hero.astro`](src/components/sections/Hero.astro) + [`Work.astro`](src/components/sections/Work.astro) now uses each artwork's `description` field as primary alt source (rich, screen-reader friendly, image-search-indexable). Hero uses natural prose ("Fish family, Madhubani painting by Megha Seth") instead of the previous "Title · Style" middle-dot string.

### Performance

- **Build-time image optimizer** at [`scripts/optimize-images.mjs`](scripts/optimize-images.mjs). Generates AVIF (q82) + WebP (q90) variants at 400/800/1200 widths from `public/artworks/`, output to `public/_opt/artworks/` (gitignored). Idempotent (mtime-aware) so warm builds skip cached variants in milliseconds. Wired into the `build` script chain (`pnpm run optimize:images && astro build`) -- runs automatically on every build, no extra step.
- **`<picture>` rendering** via new [`src/components/ui/ArtworkImage.astro`](src/components/ui/ArtworkImage.astro). Emits a multi-format `<source srcset>` chain (AVIF first, WebP fallback) at all three widths plus the original JPEG as the `<img>` fallback for browsers without modern format support. Browser picks the smallest format-width pair its viewport actually needs. Used by both Hero and Work; the legacy plain `<img>` path stays only for the deterministic SVG-placeholder fallback when an artwork has no `image` field.
- **LCP preload + priority hints.** Hero image is now preloaded via `<link rel="preload" as="image" fetchpriority="high">` in `<head>`, with `fetchpriority="high"` on the `<img>` itself. The browser's preload scanner discovers and starts fetching the LCP image during head parse instead of waiting for body discovery.
- **Per-user image weight (real-world).** Initial paint dropped from ~5 MB to ~1 MB. Full-gallery scroll dropped from ~25 MB to ~5-7 MB. Quality stays pristine at the chosen AVIF/WebP qualities -- Madhubani hatching and Gond dot patterns reproduce without visible artifacts.
- **Removed the fade-in / skeleton machinery.** With optimized images painting near-instantly, the JS-managed `.img-fade` opacity gate and `.skel` shimmer overlay added a stale flash and broke under the new `<picture>` DOM (parent walk no longer reached the `[data-loaded]` wrapper). Deleted the CSS, the markup, and the [`ImageLoadController`](src/components/layout/ImageLoadController.astro) component. Images render directly on first paint.

### Accessibility

- **`<meta name="theme-color">`** for both light and dark color schemes in [`BaseLayout.astro`](src/layouts/BaseLayout.astro). Mobile browser address bar now blends with the page palette in either theme.
- **Hero parallax script** in [`Hero.astro`](src/components/sections/Hero.astro) now selects shadow + image-wrapper divs by `[data-shadow]` / `[data-inner]` attributes instead of `frame.children[0]` / `[1]`. Adding child elements (captions, badges, decorations) won't silently break the tilt anymore.

### Code health

- **Removed dead [`Reveal.astro`](src/components/layout/Reveal.astro) component.** Wrapper that just added `class="reveal"` to a div -- no section ever imported it; the `delay` prop was already superseded by the CSS `.stagger > .reveal:nth-child(n)` auto-stagger pattern.
- **Removed CI's duplicate `upload-pages-artifact` step** from [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Was uploading the build to Pages on push to main, but [`deploy.yml`](.github/workflows/deploy.yml) does the same upload before deploying. CI now does only its job (typecheck + build); deploy handles deployment. Saves ~30s per push.
- **Removed inline `onload="..."` handlers** from gallery and hero `<img>` tags. Briefly replaced with a consolidated [`ImageLoadController`](src/components/layout/ImageLoadController.astro) that attached load listeners centrally; then removed entirely along with the fade-in machinery. Final state: zero inline event handlers in the rendered HTML, CSP-clean.

### Documentation

- [`README.md`](README.md) now reflects the actual image pipeline (build-time `sharp`, `<picture>` with srcset), the SEO infrastructure (sitemap, JSON-LD, OG, canonical), and the updated project layout (`scripts/`, `public/_opt/`, new `ArtworkImage` component, new `lib/structured-data.ts`).
- [`CLAUDE.md`](CLAUDE.md) gains an Image-pipeline + SEO bullet under Stack, refreshed Key files list, and a corrected Gotchas entry that no longer claims "Astro generates AVIF + WebP" (it doesn't -- the build script does).
- [`.claude/skills/new-artwork/SKILL.md`](.claude/skills/new-artwork/SKILL.md) updated to describe the actual optimizer flow (drop file → build runs `optimize:images` → `<picture>` ships AVIF + WebP + JPEG fallback automatically).

## 1.0.0 -- 2026-05-17

First public release. The site is live, content-complete with 21 artworks, light + dark themes, mobile-tested, JSON-driven, and deployed to GitHub Pages.

### Stack and architecture

- **Astro 6** + **React 19** islands + **TypeScript** strict + **Tailwind 4** via `@tailwindcss/vite`.
- Self-hosted **Cormorant Garamond** (display serif), **Inter** (body), and **Tiro Devanagari Hindi** (accent) via `@fontsource(-variable)`. No CDN font calls.
- Astro content collections load from JSON (no Markdown files for display data).
- Project-wide TS strict via `astro/tsconfigs/strict`. Path alias `@/*` -> `src/*`.

### Content model

- [`src/data/site.json`](src/data/site.json) -- single source of truth for brand, nav, contact, styles list, and every section's copy + the workshops list.
- [`src/data/artworks.json`](src/data/artworks.json) -- canonical artwork catalog. Each entry: slug, title, style, medium, aspect ratio, featured flag, order, description, image filename.
- [`public/artworks/`](public/artworks/) -- one `<slug>.jpg` per piece. Astro generates AVIF + WebP at build.
- [`src/content.config.ts`](src/content.config.ts) -- Zod schemas enforce both collections. Adding a piece is "drop file + append entry"; the type system rejects bad data at build time.
- [`src/lib/images.ts`](src/lib/images.ts) -- `artworkUrl(art, baseUrl)` builds public URLs.
- [`src/lib/placeholder.ts`](src/lib/placeholder.ts) -- deterministic per-style SVG placeholders for any piece without an image (5 pattern variants × 6 style palettes).

### Layout

- Single page composing `Hero`, `Work`, `About`, `Workshops`, `Contact`. Sticky thin top nav with theme toggle. Footer with iconified social links.
- All section copy comes from `site.json`; no hardcoded English in section components.
- Section wrapper, header, footer, theme script, and reveal controller live under [`src/components/layout/`](src/components/layout/).
- Reusable UI primitives -- `IconButton.astro`, `Pill.astro`, `Card.astro` -- live under [`src/components/ui/`](src/components/ui/) so design tokens stay consistent.

### Theme system

- Light + dark themes with warm off-white / charcoal palette and a single terracotta accent. Dark mode samples a slightly warmer accent for legibility on dark.
- Tokens defined with Tailwind 4 `@theme` in [`src/styles/globals.css`](src/styles/globals.css). Components reference `var(--color-*)` -- no hardcoded hex.
- Theme toggle: lined style (hairline border, transparent fill, accent on hover). Sun/moon glyphs crossfade with rotate+translate transition.
- No-FOUC inline `<head>` script reads `localStorage` and `prefers-color-scheme` before paint.

### Hero and gallery

- Hero -- typographic-led: italic display name with a Devanagari `म` accent, tagline, description, style pills, and a layered motion-design artwork frame:
  - Slow Ken Burns zoom on the artwork itself (22s, alternating).
  - Gentle vertical float on the framed wrapper (9s, ease-in-out).
  - Pulsing accent halo behind the frame (6s).
  - Mouse-driven parallax tilt with layered drop shadow on hover (desktop only).
  - All four motion layers respect `prefers-reduced-motion` and `(hover: none)`.
- Gallery -- server-rendered cards (no React island for the grid). Uniform 3:4 frames with `object-contain` so full folk-art borders show. Filter pills toggle visibility via a tiny inline script + CSS attribute matching. Native `loading="lazy"` for off-screen images.
- 3D card tilt on hover via vanilla rAF-coalesced transform. Skipped on `(hover: none)` and `prefers-reduced-motion`.

### Iconography

- Inline SVG icons in [`src/components/ui/icons/`](src/components/ui/icons/): `Instagram.astro`, `Whatsapp.astro`, `Mail.astro`. Stroke uses `currentColor` so they theme automatically. Used in Contact rows and Footer. No icon library dependency.

### Motion

- Single site-wide `IntersectionObserver` reveals `.reveal` elements as they enter view.
- `.stagger > .reveal:nth-child(n)` auto-ladders transition-delays via CSS so sections never hand-code per-element delays.
- All motion respects `prefers-reduced-motion` (animations disabled, transitions zeroed) and `(hover: none)` (no tilt on touch).

### Responsive design

- Hero typography scales `text-5xl` -> `text-7.5rem`; gap, padding, and Devanagari-mark margin all reduce on mobile.
- Header nav becomes a horizontally-scrollable scrollbar-hidden list on small screens (no hamburger needed).
- Gallery -- 1 column mobile, 2 cols `sm`, 3 cols `lg`. Hover overlays stay visible on touch via `.touch-show`.
- Contact rows use `break-all` so long emails don't overflow narrow viewports.

### CI / CD

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) -- typecheck + build on every PR and push to `main`. Frozen lockfile.
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) -- builds and deploys to GitHub Pages on push to `main`. OIDC-based auth, queue-don't-cancel concurrency.

### Hardening

- `.gitignore` excludes `.claude/settings.local.json`, `CLAUDE.local.md`, secrets (`*.key`, `*.p12`, `secrets.json`, `credentials.json`), root-level `*.png` (dev screenshots), and editor noise (`*.swp`, `*~`, `.history/`).
- All artwork rights cleared. No PII in the repo (contact details live in `site.json` and are already public on the artist's profiles).

### Documentation

- [`CLAUDE.md`](CLAUDE.md) reflects the locked stack, JSON content model, branching rules, and component conventions.
- [`MEMORY.md`](MEMORY.md) holds locked decisions and pending domain-registration work.
- [`README.md`](README.md) describes stack, dev commands, content model, and how to add an artwork.
- [`.claude/skills/new-artwork/SKILL.md`](.claude/skills/new-artwork/SKILL.md) is the unstubbed recurring-task skill: drop file, append entry, verify, commit.
