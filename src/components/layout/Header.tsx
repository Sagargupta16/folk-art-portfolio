import ThemeToggle from "@/components/ui/ThemeToggle";
import { useMagnetic } from "@/hooks/useMagnetic";
import { brand, nav } from "@/lib/site";

function MagneticLink({ href, children }: { href: string; children: React.ReactNode }) {
	const { ref, onMouseMove, onMouseLeave } = useMagnetic(0.25);
	return (
		<a
			ref={ref as React.Ref<HTMLAnchorElement>}
			href={href}
			onMouseMove={onMouseMove}
			onMouseLeave={onMouseLeave}
			className="t-meta inline-block tracking-[0.16em] text-[var(--color-muted)] transition hover:text-[var(--color-accent)]"
			style={{ transition: "transform 0.3s ease, color 0.2s ease" }}
		>
			{children}
		</a>
	);
}

const BASE = import.meta.env.BASE_URL;
const logoUrl = `${BASE}${brand.logo}`;

export default function Header() {
	return (
		<header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-bg)]/85 backdrop-blur-md">
			<div className="container-x flex items-center justify-between gap-3 py-3 sm:gap-4 sm:py-4">
				<a
					href="#top"
					className="group flex shrink-0 items-center gap-2 transition sm:gap-3"
					aria-label={`${brand.logoAlt} -- home`}
				>
					<img
						src={logoUrl}
						alt=""
						width="40"
						height="40"
						loading="eager"
						decoding="async"
						className="h-8 w-8 rounded-full object-cover ring-1 ring-[var(--color-line)] transition group-hover:ring-[var(--color-accent)] sm:h-10 sm:w-10"
					/>
					<span
						className="t-display text-lg leading-none text-[var(--color-ink)] transition group-hover:text-[var(--color-accent)] sm:text-xl"
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
								<MagneticLink href={item.href}>{item.label}</MagneticLink>
							</li>
						))}
					</ul>
				</nav>

				<ThemeToggle />
			</div>

			<nav aria-label="Primary mobile" className="border-t border-[var(--color-line)] sm:hidden">
				<ul className="container-x flex flex-wrap items-center justify-center gap-x-3 gap-y-0 py-1.5">
					{nav.map((item) => (
						<li key={item.href} className="shrink-0">
							<a
								href={item.href}
								className="flex min-h-[40px] items-center px-1 py-2 font-body text-[0.7rem] uppercase tracking-[0.06em] text-[var(--color-muted)] transition hover:text-[var(--color-accent)]"
							>
								{item.label}
							</a>
						</li>
					))}
				</ul>
			</nav>
		</header>
	);
}
