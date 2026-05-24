import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useMagnetic } from "@/hooks/useMagnetic";
import { brand, nav } from "@/lib/site";

type NavItem = (typeof nav)[number];

function MagneticLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
	const { ref, onMouseMove, onMouseLeave } = useMagnetic(0.25);
	return (
		<a
			ref={ref as React.Ref<HTMLAnchorElement>}
			href={item.href}
			onMouseMove={onMouseMove}
			onMouseLeave={onMouseLeave}
			aria-current={isActive ? "true" : undefined}
			className="t-meta relative inline-block tracking-[0.16em] text-[var(--color-muted)]"
			style={{
				transition: "transform var(--motion-hover), color var(--motion-tap)",
				color: isActive ? "var(--color-accent)" : undefined,
			}}
		>
			<span className="inline-block">{item.label}</span>
			<span
				aria-hidden="true"
				className="pointer-events-none absolute -bottom-1 left-0 right-0 mx-auto h-px"
				style={{
					background: "var(--color-accent)",
					transformOrigin: "center",
					transform: `scaleX(${isActive ? 1 : 0})`,
					transition: "transform var(--motion-hover)",
				}}
			/>
		</a>
	);
}

const BASE = import.meta.env.BASE_URL;
const logoUrl = `${BASE}${brand.logo}`;

function useActiveSection(items: readonly NavItem[]) {
	const [active, setActive] = useState<string | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const targets = items
			.map((item) => {
				const id = item.href.startsWith("#") ? item.href.slice(1) : "";
				if (!id) return null;
				const el = document.getElementById(id);
				return el ? { href: item.href, el } : null;
			})
			.filter((entry): entry is { href: string; el: HTMLElement } => entry !== null);

		if (targets.length === 0) return;

		const visibility = new Map<string, number>();
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const match = targets.find((t) => t.el === entry.target);
					if (!match) continue;
					visibility.set(match.href, entry.intersectionRatio);
				}
				let topHref: string | null = null;
				let topRatio = 0;
				for (const [href, ratio] of visibility) {
					if (ratio > topRatio) {
						topRatio = ratio;
						topHref = href;
					}
				}
				if (topHref && topRatio > 0) setActive(topHref);
			},
			{
				rootMargin: "-30% 0px -55% 0px",
				threshold: [0, 0.25, 0.5, 0.75, 1],
			},
		);

		for (const target of targets) observer.observe(target.el);
		return () => observer.disconnect();
	}, [items]);

	return active;
}

export default function Header() {
	const active = useActiveSection(nav);

	return (
		<header
			className="glass-strong sticky top-0 z-40"
			style={{
				borderBottom: "1px solid var(--surface-glass-border)",
			}}
		>
			{/* Thin pigment-mix divider strip at the very top edge */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 top-0 h-px"
				style={{
					background:
						"linear-gradient(90deg, transparent, color-mix(in oklch, var(--color-marigold) 55%, transparent) 30%, color-mix(in oklch, var(--color-ruby) 55%, transparent) 50%, color-mix(in oklch, var(--color-peacock) 55%, transparent) 70%, transparent)",
					opacity: 0.7,
				}}
			/>

			<div className="container-x flex items-center justify-between gap-3 py-3 sm:gap-4 sm:py-4">
				<a
					href="#top"
					className="group flex shrink-0 items-center gap-2 sm:gap-3"
					style={{ transition: "transform var(--motion-hover)" }}
					aria-label={`${brand.logoAlt} -- home`}
				>
					<img
						src={logoUrl}
						alt=""
						width="40"
						height="40"
						loading="eager"
						decoding="async"
						className="h-8 w-8 rounded-full object-cover ring-1 ring-[var(--color-line)] group-hover:ring-[var(--color-accent)] sm:h-10 sm:w-10"
						style={{ transition: "box-shadow var(--motion-hover)" }}
					/>
					<span
						className="t-display text-lg leading-none text-[var(--color-ink)] group-hover:text-[var(--color-accent)] sm:text-xl"
						style={{ transition: "color var(--motion-tap)" }}
						aria-hidden="true"
					>
						{brand.headline.latinPrefix}
						<span lang="hi" className="font-devanagari not-italic text-[var(--color-accent)]">
							{brand.headline.devanagariCore}
						</span>
					</span>
				</a>

				<nav aria-label="Primary" className="hidden min-w-0 flex-1 sm:block">
					<ul className="flex items-center justify-end gap-5 md:gap-7">
						{nav.map((item) => (
							<li key={item.href} className="shrink-0">
								<MagneticLink item={item} isActive={active === item.href} />
							</li>
						))}
					</ul>
				</nav>

				<ThemeToggle />
			</div>

			{/* Mobile sub-nav: lighter glass, soft top divider */}
			<nav
				aria-label="Primary mobile"
				className="glass sm:hidden"
				style={{
					borderTop: "1px solid color-mix(in oklch, var(--surface-glass-border) 60%, transparent)",
				}}
			>
				<ul className="container-x flex flex-wrap items-center justify-center gap-x-3 gap-y-0 py-1.5">
					{nav.map((item) => {
						const isActive = active === item.href;
						return (
							<li key={item.href} className="shrink-0">
								<a
									href={item.href}
									aria-current={isActive ? "true" : undefined}
									className="relative flex min-h-[40px] items-center px-1 py-2 font-body text-[0.7rem] uppercase tracking-[0.06em]"
									style={{
										color: isActive ? "var(--color-accent)" : "var(--color-muted)",
										transition: "color var(--motion-tap)",
									}}
								>
									<span>{item.label}</span>
									<span
										aria-hidden="true"
										className="pointer-events-none absolute bottom-1 left-1 right-1 h-px"
										style={{
											background: "var(--color-accent)",
											transformOrigin: "center",
											transform: `scaleX(${isActive ? 1 : 0})`,
											transition: "transform var(--motion-hover)",
										}}
									/>
								</a>
							</li>
						);
					})}
				</ul>
			</nav>
		</header>
	);
}
