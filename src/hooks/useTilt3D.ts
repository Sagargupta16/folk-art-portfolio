import { useCallback, useRef } from "react";
import { isTouchOnly } from "@/lib/media";

type TiltOptions = {
	maxAngle?: number;
	perspective?: number;
	scale?: number;
};

export function useTilt3D({ maxAngle = 8, perspective = 1000, scale = 1.02 }: TiltOptions = {}) {
	const ref = useRef<HTMLElement>(null);
	const rafRef = useRef(0);

	const onMouseMove = useCallback(
		(e: React.MouseEvent) => {
			const el = ref.current;
			if (!el) return;
			if (isTouchOnly()) return;

			cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(() => {
				const rect = el.getBoundingClientRect();
				const x = (e.clientX - rect.left) / rect.width - 0.5;
				const y = (e.clientY - rect.top) / rect.height - 0.5;
				el.style.transform = `perspective(${perspective}px) rotateX(${(-y * maxAngle).toFixed(2)}deg) rotateY(${(x * maxAngle).toFixed(2)}deg) scale3d(${scale}, ${scale}, 1)`;
			});
		},
		[maxAngle, perspective, scale],
	);

	const onMouseLeave = useCallback(() => {
		const el = ref.current;
		if (!el) return;
		cancelAnimationFrame(rafRef.current);
		el.style.transform = "";
	}, []);

	return { ref, onMouseMove, onMouseLeave };
}
