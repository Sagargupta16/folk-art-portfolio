/**
 * Tailwind classname merger -- the canonical shadcn/ui `cn()` helper.
 *
 * Combines `clsx` (conditional classes) with `tailwind-merge` (resolves
 * conflicting Tailwind utilities so `cn("p-2", isLarge && "p-6")` ends up
 * with just `p-6`).
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
