import type { ReactNode } from "react";

type Props = {
	id: string;
	eyebrow?: string;
	title?: string;
	lead?: string;
	accent?: string;
	align?: "center" | "left";
	children: ReactNode;
};

export default function Section({
	id,
	eyebrow,
	title,
	lead,
	accent,
	align = "left",
	children,
}: Props) {
	const style = accent ? ({ "--section-accent": accent } as React.CSSProperties) : undefined;
	const textAlign = align === "center" ? "text-center" : "";

	return (
		<section id={id} className="section" style={style} data-align={align}>
			<div className="container-x">
				{(eyebrow || title || lead) && (
					<header className={`stagger mb-10 sm:mb-14 ${textAlign}`}>
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
