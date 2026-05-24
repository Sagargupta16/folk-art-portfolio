"use client";

import { motion } from "motion/react";

/**
 * Character-by-character entrance for the hero lead.
 *
 * Each character renders as a span; on mount the spans fade up in
 * sequence. `MotionConfig reducedMotion="user"` from the root layout
 * automatically suppresses the animation when the user prefers reduced
 * motion -- no per-component branching needed.
 *
 * Restraint: characters animate over a small distance (8px) and fast
 * (300ms each) with a small per-character delay (12ms) so the total
 * lands inside ~1.5s for a typical 80-char description. Anything more
 * theatrical than this reads as an intro animation, not a flourish.
 */
interface SplitTextProps {
	text: string;
	className?: string;
	startDelayMs?: number;
}

export function SplitText({ text, className, startDelayMs = 0 }: SplitTextProps) {
	const chars = Array.from(text);
	return (
		<span className={className}>
			{chars.map((ch, i) => (
				<motion.span
					// Position IS the identity for a character split; the same letter can
					// appear multiple times and order is what we animate.
					// biome-ignore lint/suspicious/noArrayIndexKey: stable position-based split
					key={`${i}-${ch}`}
					className="inline-block"
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{
						duration: 0.3,
						delay: (startDelayMs + i * 12) / 1000,
						ease: [0.16, 1, 0.3, 1],
					}}
				>
					{ch === " " ? " " : ch}
				</motion.span>
			))}
		</span>
	);
}
