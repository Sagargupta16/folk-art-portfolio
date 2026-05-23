import { useCallback, useRef } from "react";
import { isTouchOnly } from "@/lib/media";

export function useMagnetic(strength = 0.3) {
	const ref = useRef<HTMLElement>(null);

	const onMouseMove = useCallback(
		(e: React.MouseEvent) => {
			const el = ref.current;
			if (!el) return;
			if (isTouchOnly()) return;
			const rect = el.getBoundingClientRect();
			const x = e.clientX - rect.left - rect.width / 2;
			const y = e.clientY - rect.top - rect.height / 2;
			el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
		},
		[strength],
	);

	const onMouseLeave = useCallback(() => {
		const el = ref.current;
		if (!el) return;
		el.style.transform = "";
	}, []);

	return { ref, onMouseMove, onMouseLeave };
}
