/**
 * Site-wide navigation header.
 *
 * Phase 1 routes are real Next.js pages (`/work`, `/about`, ...), unlike
 * site.json's anchor-style `#work` hrefs that targeted the old single-page
 * layout. Keep the link list here so both stay in sync visually with the
 * site's brand mark.
 */
import Link from "next/link";
import { getSite } from "@/lib/data";

const NAV: { label: string; href: string }[] = [
	{ label: "Work", href: "/work" },
	{ label: "About", href: "/about" },
	{ label: "Workshops", href: "/workshops" },
	{ label: "Custom Orders", href: "/custom-orders" },
	{ label: "Contact", href: "/contact" },
];

export function SiteHeader() {
	const site = getSite();
	return (
		<header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-bg)]/85 backdrop-blur">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
				<Link
					href="/"
					className="font-display text-xl italic tracking-tight"
					aria-label={`${site.brand.publicName} -- home`}
				>
					{site.brand.headline.latinPrefix}
					<span lang="hi" className="not-italic text-[var(--color-accent)]">
						{site.brand.headline.devanagariCore}
					</span>
				</Link>
				<nav aria-label="Primary" className="hidden sm:block">
					<ul className="flex items-center gap-6">
						{NAV.map((item) => (
							<li key={item.href}>
								<Link
									href={item.href}
									className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)]"
								>
									{item.label}
								</Link>
							</li>
						))}
					</ul>
				</nav>
			</div>
		</header>
	);
}
