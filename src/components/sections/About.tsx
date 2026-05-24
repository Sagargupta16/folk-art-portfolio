import Section from "@/components/layout/Section";
import { brand, sections } from "@/lib/site";

const a = sections.about;

export default function About() {
	return (
		<Section id="about" eyebrow={a.eyebrow} title={a.title} accent="var(--color-marigold)">
			{/* Ambient pigment wash. Sits behind content; the section's stacking
			   context keeps the editorial body legible above. */}
			<div className="aurora pointer-events-none" aria-hidden="true" style={{ opacity: 0.35 }} />
			<div className="relative z-1 grid gap-10 md:grid-cols-12">
				<div className="stagger space-y-5 md:col-span-8">
					{a.paragraphs.map((p: string, i: number) => (
						<p key={p.slice(0, 24)} className={`t-body reveal${i === 0 ? " drop-cap" : ""}`}>
							{p}
						</p>
					))}
					{/* Magazine pull-quote: glass panel with a heavy left border in the
					   section pigment. Reads as an editorial sidebar lift, not just a
					   styled <blockquote>. */}
					<blockquote
						className="glass reveal mt-10 px-6 py-7 sm:px-8 sm:py-8"
						style={{
							borderLeft: "4px solid var(--section-accent)",
						}}
					>
						<p
							className="t-display text-2xl sm:text-3xl"
							style={{ color: "var(--section-accent)" }}
						>
							{a.pullQuote}
						</p>
					</blockquote>
					<p className="reveal mt-2 text-right" aria-hidden="true">
						<span
							lang="hi"
							className="font-devanagari text-3xl"
							style={{
								color: "color-mix(in oklch, var(--section-accent) 70%, var(--color-muted))",
							}}
						>
							इति
						</span>
					</p>
				</div>
				<aside className="md:col-span-4">
					{/* Lifted aside as a glass card -- the meta facts read like a
					   colophon next to the article body. */}
					<div className="glass stagger space-y-5 px-6 py-7 sm:px-7 sm:py-8">
						<h3 className="t-eyebrow reveal" style={{ color: "var(--section-accent)" }}>
							At a glance
						</h3>
						<div className="reveal space-y-1">
							<p className="t-meta">Based in</p>
							<p className="t-body">{brand.location}</p>
						</div>
						<div className="reveal space-y-1">
							<p className="t-meta">{a.asideHeading}</p>
							<p className="t-body">{a.asideBody}</p>
						</div>
					</div>
				</aside>
			</div>
		</Section>
	);
}
