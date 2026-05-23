import { artworks } from "@/lib/site";

const titles = artworks.map((a) => a.title).slice(0, 14);
const devanagari = ["कमल", "मृग", "गाय", "मीन", "मोर", "वृक्ष", "सरिता"];

const items: { text: string; lang?: string }[] = [];
const max = Math.max(titles.length, devanagari.length);
for (let i = 0; i < max; i++) {
	if (titles[i]) items.push({ text: titles[i] });
	if (devanagari[i]) items.push({ text: devanagari[i], lang: "hi" });
}

function TrackContent() {
	return (
		<>
			{items.map((item) => (
				<span
					key={item.text}
					className={`shrink-0 text-3xl sm:text-4xl md:text-[2.6rem] ${
						item.lang
							? "font-devanagari text-[var(--color-accent)] not-italic"
							: "t-display text-[var(--color-ink)]"
					}`}
					lang={item.lang}
				>
					{item.text}
				</span>
			))}
		</>
	);
}

export default function Marquee() {
	return (
		<aside
			className="relative border-y border-[var(--color-line)] bg-[var(--color-bg-soft)] py-7"
			aria-hidden="true"
		>
			<div className="marquee">
				<div className="marquee__track">
					<TrackContent />
				</div>
				<div className="marquee__track">
					<TrackContent />
				</div>
			</div>
		</aside>
	);
}
