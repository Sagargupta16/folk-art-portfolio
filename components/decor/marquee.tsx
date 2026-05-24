/**
 * Marquee -- a horizontally scrolling band of artwork titles + Devanagari
 * words, sat between the hero and the Selected Work rail on the home page.
 *
 * Pure CSS animation (transform: translateX, infinite, linear). Two
 * tracks render the same content side-by-side so the seam is invisible
 * during the wrap. Hover pauses, prefers-reduced-motion stops it.
 */
import { getAllArtworks } from "@/lib/data";
import "./marquee.css";

const DEVANAGARI_WORDS: readonly string[] = ["कमल", "मृग", "गाय", "मीन", "मोर", "वृक्ष", "सरिता"];

function buildItems() {
	const titles = getAllArtworks()
		.slice(0, 14)
		.map((a) => a.title);
	const items: { text: string; lang?: "hi" }[] = [];
	const max = Math.max(titles.length, DEVANAGARI_WORDS.length);
	for (let i = 0; i < max; i++) {
		const t = titles[i];
		if (t) items.push({ text: t });
		const d = DEVANAGARI_WORDS[i];
		if (d) items.push({ text: d, lang: "hi" });
	}
	return items;
}

function Track() {
	const items = buildItems();
	return (
		<>
			{items.map((item) => (
				<span
					key={item.text}
					lang={item.lang}
					className={
						item.lang
							? "shrink-0 font-devanagari text-3xl text-accent sm:text-4xl md:text-[2.6rem]"
							: "t-display shrink-0 text-3xl text-ink sm:text-4xl md:text-[2.6rem]"
					}
				>
					{item.text}
				</span>
			))}
		</>
	);
}

export function Marquee() {
	return (
		<aside
			aria-hidden="true"
			className="relative border-y border-line bg-bg-soft py-7 overflow-hidden"
		>
			<div className="marquee">
				<div className="marquee__track">
					<Track />
				</div>
				<div className="marquee__track" aria-hidden="true">
					<Track />
				</div>
			</div>
		</aside>
	);
}
