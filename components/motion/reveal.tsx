"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Reveal -- a fade-up wrapper used across home + page sections.
 *
 * The first time the element enters the viewport, it fades in and lifts
 * 16px. Subsequent scrolls don't replay (`once: true`). When the OS
 * prefers reduced motion, the element renders in its final state without
 * any animation -- accessibility contract is honoured here, not by
 * components that import this.
 *
 * `delayMs` is the entry delay (ms). Use in lists for a small stagger
 * (e.g. `delayMs={index * 60}`). Don't go past ~5 elements with stagger;
 * after that the eye reads choreography as theatrical.
 */
interface RevealProps {
	children: ReactNode;
	delayMs?: number;
	className?: string;
	/** Tag to render. Defaults to a div. */
	as?: "div" | "section" | "article" | "li" | "h1" | "h2" | "h3" | "p";
}

export function Reveal({ children, delayMs = 0, className, as = "div" }: RevealProps) {
	const reduced = useReducedMotion();
	const Tag = motion[as];

	if (reduced) {
		// Render the final state directly -- no opacity transition, no transform.
		const Static = as;
		return <Static className={className}>{children}</Static>;
	}

	return (
		<Tag
			className={className}
			initial={{ opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "0px 0px -10% 0px" }}
			transition={{
				duration: 0.7,
				ease: [0.16, 1, 0.3, 1],
				delay: delayMs / 1000,
			}}
		>
			{children}
		</Tag>
	);
}
