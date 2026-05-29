"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Reveal -- a fade-up wrapper used across home + page sections.
 *
 * The first time the element enters the viewport, it fades in and lifts
 * 16px. Subsequent scrolls don't replay (`once: true`). When the user has
 * `prefers-reduced-motion`, Motion's library-level handling (configured by
 * <MotionConfig reducedMotion="user"> in the root layout) skips transitions
 * and renders the final state -- we don't branch on a hook value here
 * because doing so produces a different React tree shape on server vs.
 * client and breaks hydration.
 *
 * No-JS / crawler fallback: SSR markup ships with inline `opacity:0`, which
 * means JS-blocked visitors would see blank pages. The `<noscript>` style
 * block in app/layout.tsx unhides any element with `opacity:0` so content
 * remains visible without JS. (Caveat: Motion-bundle-load failure on a
 * JS-enabled client still leaves content hidden -- accepted trade-off.)
 *
 * `delayMs` is the entry delay (ms). Use in lists for a small stagger
 * (e.g. `delayMs={index * 60}`).
 */
interface RevealProps {
	children: ReactNode;
	delayMs?: number;
	className?: string;
	/** Tag to render. Defaults to a div. */
	as?: "div" | "section" | "article" | "li" | "h1" | "h2" | "h3" | "p";
}

export function Reveal({ children, delayMs = 0, className, as = "div" }: RevealProps) {
	const Tag = motion[as];
	return (
		<Tag
			className={className}
			initial={{ opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "0px 0px -10% 0px" }}
			transition={{
				duration: 0.5,
				ease: [0.16, 1, 0.3, 1],
				delay: delayMs / 1000,
			}}
		>
			{children}
		</Tag>
	);
}
