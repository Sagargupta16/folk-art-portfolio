"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Theme toggle -- 3-state (light / dark / system).
 *
 * The pre-paint script in app/layout.tsx already reads localStorage.theme
 * and adds `class="dark"` to <html> before first paint. This component
 * lets the user change that preference. We keep three modes so users can
 * defer to OS without locking in a choice.
 *
 * Persistence:
 *   - light  -> localStorage.theme = "light",  remove .dark
 *   - dark   -> localStorage.theme = "dark",   add    .dark
 *   - system -> localStorage.theme removed,    apply matchMedia result
 *
 * `system` deliberately clears the storage key (rather than writing
 * "system") so the pre-paint script in app/layout.tsx falls back to
 * `matchMedia` and tracks live OS theme changes. A stored "system" string
 * would force a manual override branch; absence is the cleanest signal.
 *
 * The component is rendered as a tiny segmented row of three buttons --
 * tappable, no dropdown trapping mobile users behind a label.
 *
 * Mounted state: useEffect-after-mount avoids hydration mismatches
 * (server has no localStorage, so the rendered icons would differ).
 * Until mounted, we render a placeholder of the same width.
 */

type Mode = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

function applyMode(mode: Mode) {
	const root = document.documentElement;
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	const wantDark = mode === "dark" || (mode === "system" && prefersDark);
	root.classList.toggle("dark", wantDark);

	if (mode === "system") {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			/* localStorage unavailable -- ignore */
		}
	} else {
		try {
			localStorage.setItem(STORAGE_KEY, mode);
		} catch {
			/* localStorage unavailable -- ignore */
		}
	}
}

function readInitialMode(): Mode {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === "light" || stored === "dark") return stored;
	} catch {
		/* ignore */
	}
	return "system";
}

const MODES: { value: Mode; label: string; Icon: typeof Sun }[] = [
	{ value: "light", label: "Light", Icon: Sun },
	{ value: "dark", label: "Dark", Icon: Moon },
	{ value: "system", label: "System", Icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
	const [mode, setMode] = useState<Mode>("system");
	const [mounted, setMounted] = useState(false);

	// Read stored preference once, on mount.
	useEffect(() => {
		setMode(readInitialMode());
		setMounted(true);
	}, []);

	// React to OS theme changes when in `system` mode.
	useEffect(() => {
		if (!mounted) return;
		if (mode !== "system") return;
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => applyMode("system");
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, [mounted, mode]);

	function setTheme(next: Mode) {
		setMode(next);
		applyMode(next);
	}

	// Pre-mount placeholder keeps layout width stable. The container's
	// width comes from the rendered buttons once we know which mode is
	// active; before that we render an opaque placeholder of the same size.
	if (!mounted) {
		return (
			<div
				aria-hidden="true"
				className={cn("inline-flex h-9 w-30 rounded-full border border-line bg-bg-soft", className)}
			/>
		);
	}

	return (
		<div
			role="group"
			aria-label="Theme"
			className={cn("inline-flex rounded-full border border-line bg-bg-soft p-0.5", className)}
		>
			{MODES.map(({ value, label, Icon }) => {
				const active = mode === value;
				return (
					<button
						key={value}
						type="button"
						aria-pressed={active}
						aria-label={`${label} theme`}
						title={`${label} theme`}
						onClick={() => setTheme(value)}
						className={cn(
							"inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
							active ? "bg-bg text-ink shadow-sm ring-1 ring-line" : "text-muted hover:text-ink",
						)}
					>
						<Icon size={14} aria-hidden="true" />
					</button>
				);
			})}
		</div>
	);
}
