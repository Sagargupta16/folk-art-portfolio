"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Site-wide Motion configuration.
 *
 * `reducedMotion="user"` -- Motion reads the user's `prefers-reduced-motion`
 * setting and, when reduced is requested, automatically skips transitions
 * (animations snap to their final value). This is the library-level way to
 * honour the accessibility contract; component-level hook checks like
 * `useReducedMotion()` cause SSR/CSR hydration mismatches because the value
 * differs between render passes.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
	return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
