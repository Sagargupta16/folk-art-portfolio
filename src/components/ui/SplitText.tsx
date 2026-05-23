import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/media";

type Props = {
	children: string;
	className?: string;
	as?: "h1" | "h2" | "h3" | "p" | "span";
	delay?: number;
};

export default function SplitText({
	children,
	className = "",
	as: Tag = "span",
	delay = 0,
}: Props) {
	const ref = useRef<HTMLElement>(null);

	useEffect(() => {
		if (prefersReducedMotion()) {
			ref.current?.classList.add("split-visible");
			return;
		}

		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setTimeout(() => {
						ref.current?.classList.add("split-visible");
					}, delay);
					io.disconnect();
				}
			},
			{ threshold: 0.3 },
		);
		if (ref.current) io.observe(ref.current);
		return () => io.disconnect();
	}, [delay]);

	const chars = children.split("");

	return (
		<Tag ref={ref as React.Ref<never>} className={`split-text ${className}`} aria-label={children}>
			{chars.map((char, i) => (
				// Position IS the identity for character splits -- the same letter can
				// appear multiple times in a word and order is what we animate.
				<span
					key={`${i}-${char}`}
					className="split-char"
					style={{ "--char-index": i } as React.CSSProperties}
					aria-hidden="true"
				>
					{char === " " ? " " : char}
				</span>
			))}
		</Tag>
	);
}
