"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

/**
 * Client island for the top bar.
 *
 * Mobile-first: brand mark on the left, hamburger toggle on the right. The
 * menu is a full-width drawer panel that opens under the header. Body
 * scroll locks while it's open. ESC closes.
 *
 * Desktop (>= 768px): the hamburger is hidden and the 5 nav links lay out
 * horizontally to the right of the brand mark with an accent underline on
 * the active route.
 *
 * Brand pieces are passed as props so the parent (Server Component) reads
 * them from `data/site.json` once and the Client island stays focused on
 * interactivity.
 */

interface NavItem {
	label: string;
	href: string;
}

interface SiteHeaderClientProps {
	brandLatinPrefix: string;
	brandDevanagariCore: string;
	brandConnector: string;
	brandSuffix: string;
}

const NAV: NavItem[] = [
	{ label: "Work", href: "/work" },
	{ label: "About", href: "/about" },
	{ label: "Workshops", href: "/workshops" },
	{ label: "Custom Orders", href: "/custom-orders" },
	{ label: "Contact", href: "/contact" },
];

export function SiteHeaderClient({
	brandLatinPrefix,
	brandDevanagariCore,
	brandConnector,
	brandSuffix,
}: SiteHeaderClientProps) {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);

	// Close drawer on route change. The effect intentionally depends on
	// `pathname` -- it's the trigger -- even though the body doesn't read it.
	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger
	useEffect(() => {
		setOpen(false);
	}, [pathname]);

	// Close drawer on Escape; lock body scroll while open.
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("keydown", onKey);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prevOverflow;
		};
	}, [open]);

	// Compress header padding once the user has scrolled past 80px. We only
	// need a threshold crossing, not the scroll value itself, so we read
	// `scrollY` directly inside an rAF-throttled listener.
	useEffect(() => {
		let raf = 0;
		const onScroll = () => {
			if (raf) return;
			raf = requestAnimationFrame(() => {
				setScrolled(window.scrollY > 80);
				raf = 0;
			});
		};
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			window.removeEventListener("scroll", onScroll);
			if (raf) cancelAnimationFrame(raf);
		};
	}, []);

	const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

	return (
		<header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur supports-backdrop-filter:bg-bg/75">
			<div
				className={cn(
					"mx-auto flex max-w-6xl items-center justify-between gap-4 px-(--container-px) transition-[padding] duration-(--duration-base) ease-out-soft",
					scrolled ? "py-2 md:py-2.5" : "py-3 md:py-4",
				)}
			>
				<Link
					href="/"
					className="t-display text-xl tracking-tight transition-colors hover:text-accent md:text-2xl"
					aria-label="Home"
				>
					<span className="not-italic">{brandLatinPrefix}</span>
					<span lang="hi" className="font-devanagari not-italic text-accent">
						{brandDevanagariCore}
					</span>
					<span className="ml-2 text-base text-muted md:text-lg">
						<span className="not-italic">{brandConnector}</span> <span>{brandSuffix}</span>
					</span>
				</Link>

				{/* Desktop nav + theme toggle */}
				<div className="hidden items-center gap-6 md:flex">
					<nav aria-label="Primary">
						<ul className="flex items-center gap-7">
							{NAV.map((item) => {
								const active = isActive(item.href);
								return (
									<li key={item.href} className="relative">
										<Link
											href={item.href}
											aria-current={active ? "page" : undefined}
											className={cn(
												"relative text-xs uppercase tracking-meta transition-colors",
												active ? "text-accent" : "text-muted hover:text-ink",
											)}
										>
											{item.label}
										</Link>
										{active ? (
											<motion.span
												aria-hidden="true"
												layoutId="header-nav-indicator"
												className="pointer-events-none absolute -bottom-1.5 left-0 right-0 h-px bg-accent"
												transition={{
													type: "spring",
													stiffness: 380,
													damping: 32,
												}}
											/>
										) : null}
									</li>
								);
							})}
						</ul>
					</nav>
					<ThemeToggle />
				</div>

				{/* Mobile theme toggle + menu trigger */}
				<div className="flex items-center gap-2 md:hidden">
					<ThemeToggle />
					<button
						type="button"
						onClick={() => setOpen((v) => !v)}
						aria-expanded={open}
						aria-controls="mobile-menu"
						aria-label={open ? "Close menu" : "Open menu"}
						className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded text-ink transition-colors hover:text-accent"
					>
						{open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
					</button>
				</div>
			</div>

			{/* Mobile drawer */}
			<div id="mobile-menu" hidden={!open} className="md:hidden">
				<nav aria-label="Primary mobile" className="border-t border-line bg-bg">
					<ul className="flex flex-col px-(--container-px) py-2">
						{NAV.map((item) => {
							const active = isActive(item.href);
							return (
								<li key={item.href}>
									<Link
										href={item.href}
										aria-current={active ? "page" : undefined}
										className={cn(
											"flex min-h-12 items-center justify-between border-b border-line py-3 text-sm transition-colors last:border-b-0",
											active ? "text-accent" : "text-ink hover:text-accent",
										)}
									>
										<span>{item.label}</span>
										<ArrowRight size={16} aria-hidden="true" className="text-muted" />
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>
			</div>
		</header>
	);
}
