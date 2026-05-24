import Link from "next/link";
import { getSite } from "@/lib/data";

/**
 * Footer -- gallery register, calm. Three blocks on desktop (brand,
 * navigate, contact), stacked on mobile. Pulls everything from site data
 * so the artist can edit copy / channels without touching the component.
 */
export function SiteFooter() {
	const { brand, contact, nav } = getSite();
	const year = new Date().getFullYear();
	const channels = [
		{ key: "instagram", ...contact.instagram },
		{ key: "whatsapp", ...contact.whatsapp },
		{ key: "email", ...contact.email },
	];

	return (
		<footer className="mt-24 border-t border-line">
			<div className="mx-auto grid max-w-6xl gap-10 px-(--container-px) py-12 sm:grid-cols-3 sm:gap-8 sm:py-14">
				<div>
					<Link
						href="/"
						className="t-display text-2xl tracking-tight transition-colors hover:text-accent"
					>
						<span className="not-italic">{brand.headline.latinPrefix}</span>
						<span lang="hi" className="font-devanagari not-italic text-accent">
							{brand.headline.devanagariCore}
						</span>
					</Link>
					<p className="mt-3 text-sm leading-relaxed text-muted">{brand.tagline}</p>
					<p className="mt-1 text-sm text-muted">{brand.location}</p>
				</div>

				<nav aria-label="Footer">
					<p className="t-eyebrow">Navigate</p>
					<ul className="mt-4 space-y-2 text-sm">
						{nav.map((item) => (
							<li key={item.href}>
								<Link
									className="text-ink transition-colors hover:text-accent"
									href={item.href.startsWith("#") ? `/${item.href.slice(1)}` : item.href}
								>
									{item.label}
								</Link>
							</li>
						))}
					</ul>
				</nav>

				<div>
					<p className="t-eyebrow">Reach out</p>
					<ul className="mt-4 space-y-2 text-sm">
						{channels.map((c) => (
							<li key={c.key}>
								<a
									className="text-ink transition-colors hover:text-accent"
									href={c.url}
									target={c.url.startsWith("http") ? "_blank" : undefined}
									rel={c.url.startsWith("http") ? "noopener noreferrer" : undefined}
								>
									{c.display ?? c.label}
								</a>
							</li>
						))}
					</ul>
				</div>
			</div>

			<div className="border-t border-line">
				<div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-(--container-px) py-5 text-xs uppercase tracking-meta text-muted sm:flex-row sm:items-center">
					<p>
						&copy; {year} {brand.title}. All rights reserved.
					</p>
					<p className="opacity-60">Site by Sagar Gupta</p>
				</div>
			</div>
		</footer>
	);
}
