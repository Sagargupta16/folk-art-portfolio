"use client";

import { motion } from "motion/react";
import { Motif, type MotifKey } from "@/components/decor/motifs";

/**
 * MotifEyebrow -- the small label that sits above every page H1, refreshed.
 *
 * The previous treatment was `<rule> <number?> <eyebrow text>`, where
 * `<rule>` was a 1px line in `--section-accent`. This swaps the rule for
 * a folk-art motif glyph -- fish, lotus, mirror, etc. -- in the same
 * pigment, drawing in once when scrolled into view via Motion's
 * `pathLength` primitive (animates `stroke-dashoffset`). One painterly
 * detail per section header without rebuilding the eyebrow contract.
 *
 * Reduced-motion: handled globally by `MotionConfig reducedMotion="user"`
 * in `MotionProvider`. We don't branch the `initial` value locally because
 * `useReducedMotion` returns `null` during SSR and the real preference
 * after hydration -- that mismatch produced a hydration error on routes
 * where the eyebrow rendered above the fold.
 *
 * `centered` flips justification for the home-page About teaser, which
 * centres its eyebrow.
 */
interface MotifEyebrowProps {
	motif: MotifKey;
	label: string;
	number?: string;
	centered?: boolean;
}

export function MotifEyebrow({ motif, label, number, centered = false }: MotifEyebrowProps) {
	return (
		<p className={`t-eyebrow flex items-center gap-3 ${centered ? "justify-center" : ""}`.trim()}>
			<motion.span
				aria-hidden="true"
				className="inline-flex shrink-0 text-(--section-accent)"
				initial={{ pathLength: 0, opacity: 0 }}
				whileInView={{ pathLength: 1, opacity: 1 }}
				viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
				transition={{
					pathLength: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
					opacity: { duration: 0.4 },
				}}
			>
				<Motif name={motif} size={16} />
			</motion.span>
			{number ? <span className="tabular-nums">{number} /</span> : null}
			<span>{label}</span>
		</p>
	);
}
