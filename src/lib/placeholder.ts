import type { ArtStyle } from "./site";

const STYLE_PALETTE: Record<ArtStyle, { bg: string; ink: string; accent: string; soft: string }> = {
	Madhubani: {
		bg: "#f3d2a3",
		ink: "#7a1f12",
		accent: "#c0392b",
		soft: "#e8a87c",
	},
	Pichwai: {
		bg: "#dceee0",
		ink: "#1f4d3a",
		accent: "#2d6a4f",
		soft: "#88c4a3",
	},
	Lippan: { bg: "#efe1c8", ink: "#5a3a1d", accent: "#b08968", soft: "#d6b893" },
	Gond: { bg: "#dde4f0", ink: "#0f1d3a", accent: "#283c63", soft: "#7791b8" },
	Texture: {
		bg: "#ecdcd6",
		ink: "#3a1f1d",
		accent: "#7d4f50",
		soft: "#b89490",
	},
	"Mixed Media": {
		bg: "#e8dcc6",
		ink: "#3a2818",
		accent: "#8e735b",
		soft: "#bea98a",
	},
};

/* Stable hash so the same title always renders the same placeholder. */
function hash(input: string): number {
	let h = 2166136261 >>> 0;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		h = Math.imul(h, 16777619) >>> 0;
	}
	return h >>> 0;
}

interface Options {
	title: string;
	style: ArtStyle;
	width?: number;
	height?: number;
}

export function placeholderSvg({ title, style, width = 600, height = 800 }: Options): string {
	const palette = STYLE_PALETTE[style];
	const seed = hash(`${title}|${style}`);
	const variant = seed % 5;

	const layers = (() => {
		switch (variant) {
			case 0:
				return concentricArches(palette, width, height);
			case 1:
				return scallopGrid(palette, width, height, seed);
			case 2:
				return petalRing(palette, width, height);
			case 3:
				return wovenStripes(palette, width, height);
			default:
				return tessellatedDots(palette, width, height, seed);
		}
	})();

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${escapeAttr(title)} placeholder">
  <rect width="${width}" height="${height}" fill="${palette.bg}"/>
  ${layers}
  <rect x="6" y="6" width="${width - 12}" height="${height - 12}" fill="none" stroke="${palette.ink}" stroke-opacity="0.18" stroke-width="2"/>
</svg>`;
}

export function placeholderDataUri(opts: Options): string {
	const svg = placeholderSvg(opts);
	return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeAttr(s: string): string {
	return s.replace(
		/[&<>"']/g,
		(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
	);
}

function concentricArches(
	p: { ink: string; accent: string; soft: string },
	w: number,
	h: number,
): string {
	const cx = w / 2;
	const cy = h * 0.65;
	const out: string[] = [];
	for (let i = 1; i <= 7; i++) {
		const r = (i * Math.min(w, h)) / 9;
		const fill = i % 2 === 0 ? p.accent : p.soft;
		out.push(
			`<path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="${fill}" stroke-width="3" opacity="${0.85 - i * 0.08}"/>`,
		);
	}
	out.push(
		`<circle cx="${cx}" cy="${cy}" r="${Math.min(w, h) / 14}" fill="${p.ink}" opacity="0.85"/>`,
	);
	return out.join("\n  ");
}

function scallopGrid(
	p: { ink: string; accent: string; soft: string },
	w: number,
	h: number,
	seed: number,
): string {
	const r = 36;
	const out: string[] = [];
	let s = seed;
	for (let y = r; y < h; y += r * 1.4) {
		for (let x = r; x < w; x += r * 1.4) {
			s = (s * 1103515245 + 12345) >>> 0;
			const fill = s % 3 === 0 ? p.accent : s % 3 === 1 ? p.soft : "transparent";
			const stroke = p.ink;
			out.push(
				`<path d="M ${x - r} ${y} A ${r} ${r} 0 0 1 ${x + r} ${y}" fill="${fill}" stroke="${stroke}" stroke-opacity="0.35" stroke-width="1.5"/>`,
			);
		}
	}
	return out.join("\n  ");
}

function petalRing(p: { ink: string; accent: string; soft: string }, w: number, h: number): string {
	const cx = w / 2;
	const cy = h / 2;
	const petalR = Math.min(w, h) * 0.22;
	const out: string[] = [];
	for (let i = 0; i < 12; i++) {
		const angle = (i / 12) * Math.PI * 2;
		const x = cx + Math.cos(angle) * petalR * 1.4;
		const y = cy + Math.sin(angle) * petalR * 1.4;
		const fill = i % 2 === 0 ? p.accent : p.soft;
		out.push(
			`<ellipse cx="${x}" cy="${y}" rx="${petalR * 0.55}" ry="${petalR * 0.28}" fill="${fill}" opacity="0.78" transform="rotate(${(angle * 180) / Math.PI} ${x} ${y})"/>`,
		);
	}
	out.push(`<circle cx="${cx}" cy="${cy}" r="${petalR * 0.4}" fill="${p.ink}" opacity="0.9"/>`);
	out.push(`<circle cx="${cx}" cy="${cy}" r="${petalR * 0.18}" fill="${p.soft}"/>`);
	return out.join("\n  ");
}

function wovenStripes(
	p: { ink: string; accent: string; soft: string },
	w: number,
	h: number,
): string {
	const out: string[] = [];
	const step = 28;
	for (let y = -h; y < h * 2; y += step) {
		out.push(
			`<line x1="0" y1="${y}" x2="${w}" y2="${y + w * 0.4}" stroke="${p.accent}" stroke-width="1.5" opacity="0.6"/>`,
		);
	}
	for (let y = -h; y < h * 2; y += step) {
		out.push(
			`<line x1="0" y1="${y + step / 2}" x2="${w}" y2="${y + step / 2 - w * 0.4}" stroke="${p.soft}" stroke-width="1.5" opacity="0.5"/>`,
		);
	}
	out.push(
		`<rect x="${w * 0.18}" y="${h * 0.32}" width="${w * 0.64}" height="${h * 0.36}" fill="${p.ink}" opacity="0.08"/>`,
	);
	return out.join("\n  ");
}

function tessellatedDots(
	p: { ink: string; accent: string; soft: string },
	w: number,
	h: number,
	seed: number,
): string {
	const out: string[] = [];
	let s = seed;
	const step = 32;
	for (let y = step; y < h; y += step) {
		for (let x = step; x < w; x += step) {
			s = (s * 1103515245 + 12345) >>> 0;
			const r = 4 + (s % 8);
			const fill = (x + y) % (step * 2) === 0 ? p.accent : p.soft;
			out.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="0.7"/>`);
		}
	}
	out.push(
		`<circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) / 5}" fill="${p.ink}" opacity="0.07"/>`,
	);
	return out.join("\n  ");
}
