import { getSite } from "@/lib/data";

export function SiteFooter() {
	const site = getSite();
	const year = new Date().getFullYear();
	return (
		<footer className="mt-24 border-t border-[var(--color-line)]">
			<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-xs uppercase tracking-[0.18em] text-[var(--color-muted)] sm:flex-row">
				<p>
					&copy; {year} {site.brand.title}
				</p>
				<p>{site.brand.location}</p>
			</div>
		</footer>
	);
}
