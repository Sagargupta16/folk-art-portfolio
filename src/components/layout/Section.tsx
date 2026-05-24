import type { ReactNode } from "react";

type Decorative = "aurora" | "mesh" | "none";

type Props = {
	id: string;
	eyebrow?: string;
	title?: string;
	lead?: string;
	accent?: string;
	align?: "center" | "left";
	/** Optional Devanagari character rendered above the title in section-accent. */
	glyph?: string;
	/** Optional ambient backdrop layer mounted behind content. */
	decorative?: Decorative;
	children: ReactNode;
};

export default function Section({
	id,
	eyebrow,
	title,
	lead,
	accent,
	align = "left",
	glyph,
	decorative = "none",
	children,
}: Props) {
	const style = accent ? ({ "--section-accent": accent } as React.CSSProperties) : undefined;
	const textAlign = align === "center" ? "text-center" : "";

	return (
		<section id={id} className="section" style={style} data-align={align}>
			{decorative === "aurora" && <div className="aurora" aria-hidden="true" />}
			{decorative === "mesh" && (
				<div className="mesh-bg" aria-hidden="true">
					<div className="mesh-blob" />
				</div>
			)}
			<div className="container-x relative">
				{(eyebrow || title || lead || glyph) && (
					<header className={`stagger mb-10 sm:mb-14 ${textAlign}`}>
						{glyph && (
							<p
								aria-hidden="true"
								lang="hi"
								className={`reveal font-devanagari not-italic leading-none mb-3 ${
									align === "center" ? "" : "text-left"
								}`}
								style={{
									color: "var(--section-accent)",
									fontSize: "1.5rem",
								}}
							>
								{glyph}
							</p>
						)}
						{eyebrow && <p className="t-eyebrow reveal mb-3">{eyebrow}</p>}
						{title && (
							<h2 className="t-display reveal text-4xl text-[var(--color-ink)] sm:text-5xl">
								{title}
							</h2>
						)}
						{lead && <p className="t-lead reveal mx-auto mt-4 max-w-2xl">{lead}</p>}
					</header>
				)}
				{children}
			</div>
		</section>
	);
}
