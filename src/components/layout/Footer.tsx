import { Instagram, Mail, Whatsapp } from "@/components/ui/icons";
import { artworks, brand, contact, nav, workshops } from "@/lib/site";

const BASE = import.meta.env.BASE_URL;
const logoUrl = `${BASE}${brand.logo}`;
const year = new Date().getFullYear();

const linkBase =
	"t-meta inline-flex items-center gap-2 text-[var(--color-muted)] hover:text-[var(--color-accent)]";
const linkStyle: React.CSSProperties = {
	transition: "color var(--motion-hover)",
};

export default function Footer() {
	return (
		<footer className="relative" style={{ borderTop: "1px solid var(--color-line)" }}>
			{/* Hand-drawn-feel pigment divider strip just under the border */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 top-0 h-px"
				style={{
					background:
						"linear-gradient(90deg, transparent, color-mix(in oklch, var(--color-ruby) 45%, transparent) 25%, color-mix(in oklch, var(--color-marigold) 45%, transparent) 50%, color-mix(in oklch, var(--color-peacock) 45%, transparent) 75%, transparent)",
					opacity: 0.6,
				}}
			/>

			<div className="container-x grid grid-cols-1 items-start gap-10 py-12 md:grid-cols-3 md:gap-8">
				{/* Column 1 -- brand mark + catalog counts */}
				<div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
					<a
						href="#top"
						className="group flex items-center gap-3"
						style={{ transition: "transform var(--motion-hover)" }}
						aria-label={`${brand.logoAlt} -- back to top`}
					>
						<img
							src={logoUrl}
							alt=""
							width="48"
							height="48"
							loading="lazy"
							decoding="async"
							className="h-10 w-10 rounded-full object-cover ring-1 ring-[var(--color-line)] group-hover:ring-[var(--color-accent)]"
							style={{ transition: "box-shadow var(--motion-hover)" }}
						/>
						<span
							className="t-display text-xl text-[var(--color-ink)] group-hover:text-[var(--color-accent)]"
							style={{ transition: "color var(--motion-hover)" }}
							aria-hidden="true"
						>
							{brand.headline.latinPrefix}
							<span lang="hi" className="font-devanagari not-italic text-[var(--color-accent)]">
								{brand.headline.devanagariCore}
							</span>
						</span>
					</a>
					<p className="t-meta">
						{workshops.length} workshops &middot; {artworks.length} works
					</p>
					<p className="t-meta opacity-70">{brand.tagline}</p>
				</div>

				{/* Column 2 -- nav re-link, with Devanagari glyph divider */}
				<nav aria-label="Footer" className="flex flex-col items-center gap-4 md:items-center">
					<span
						aria-hidden="true"
						lang="hi"
						className="kinetic-devanagari font-devanagari text-2xl not-italic leading-none"
					>
						{brand.devanagariMark}
					</span>
					<ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
						{nav.map((item) => (
							<li key={item.href}>
								<a href={item.href} className={linkBase} style={linkStyle}>
									{item.label}
								</a>
							</li>
						))}
					</ul>
				</nav>

				{/* Column 3 -- contact icons + year */}
				<div className="flex flex-col items-center gap-3 md:items-end">
					<div className="flex flex-wrap items-center justify-center gap-3 md:justify-end md:gap-4">
						<a
							className={linkBase}
							style={linkStyle}
							href={contact.instagram.url}
							target="_blank"
							rel="noopener noreferrer"
							aria-label="Instagram"
						>
							<Instagram size={16} />
							<span>Instagram</span>
						</a>
						<a
							className={linkBase}
							style={linkStyle}
							href={contact.whatsapp.url}
							target="_blank"
							rel="noopener noreferrer"
							aria-label="WhatsApp"
						>
							<Whatsapp size={16} />
							<span>WhatsApp</span>
						</a>
						<a className={linkBase} style={linkStyle} href={contact.email.url} aria-label="Email">
							<Mail size={16} />
							<span>Email</span>
						</a>
					</div>
					<span className="t-meta">
						&copy; {year} &middot; {brand.publicName}
					</span>
				</div>
			</div>
		</footer>
	);
}
