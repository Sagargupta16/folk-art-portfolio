import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/media";

type Particle = {
	x: number;
	y: number;
	z: number;
	vx: number;
	vy: number;
	vz: number;
	size: number;
	color: string;
};

/* Particle pigments are read from the live CSS custom properties at mount, so
   light/dark theme swaps on next remount automatically reflow the canvas. We
   resolve each token to its computed color and sandwich a per-pigment alpha
   on top via color-mix -- single source of truth lives in globals.css. */
const PIGMENT_TOKENS: ReadonlyArray<{ token: string; alpha: number }> = [
	{ token: "--color-ruby", alpha: 0.6 },
	{ token: "--color-marigold", alpha: 0.5 },
	{ token: "--color-peacock", alpha: 0.5 },
	{ token: "--color-indigo", alpha: 0.4 },
	{ token: "--color-neem", alpha: 0.4 },
	{ token: "--color-vermillion", alpha: 0.5 },
];
const CONNECTION_PIGMENT_TOKEN = "--color-ruby";

const PARTICLE_COUNT = 60;
const CONNECTION_DIST = 120;
const ROTATION_SPEED = 0.0003;

function readToken(name: string): string {
	const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	return value || "#000";
}

function withAlpha(color: string, alpha: number): string {
	return `color-mix(in oklch, ${color} ${Math.round(alpha * 100)}%, transparent)`;
}

export default function ParticleField() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animRef = useRef(0);

	useEffect(() => {
		if (prefersReducedMotion()) return;

		if (!canvasRef.current) return;
		const canvas: HTMLCanvasElement = canvasRef.current;
		const ctxOrNull = canvas.getContext("2d");
		if (!ctxOrNull) return;
		const ctx: CanvasRenderingContext2D = ctxOrNull;

		let w = 0;
		let h = 0;
		let angle = 0;
		let running = true;

		function resize() {
			const dpr = window.devicePixelRatio || 1;
			const rect = canvas.getBoundingClientRect();
			w = rect.width;
			h = rect.height;
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			ctx.scale(dpr, dpr);
		}
		resize();
		window.addEventListener("resize", resize);

		const colors = PIGMENT_TOKENS.map(({ token, alpha }) => withAlpha(readToken(token), alpha));
		const connectionPigment = readToken(CONNECTION_PIGMENT_TOKEN);

		const particles: Particle[] = [];
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			particles.push({
				x: (Math.random() - 0.5) * w * 1.2,
				y: (Math.random() - 0.5) * h * 1.2,
				z: Math.random() * 400 - 200,
				vx: (Math.random() - 0.5) * 0.3,
				vy: (Math.random() - 0.5) * 0.3,
				vz: (Math.random() - 0.5) * 0.2,
				size: Math.random() * 2.5 + 1,
				color: colors[Math.floor(Math.random() * colors.length)],
			});
		}

		function project(p: Particle) {
			const cosA = Math.cos(angle);
			const sinA = Math.sin(angle);
			const cosB = Math.cos(angle * 0.7);
			const sinB = Math.sin(angle * 0.7);

			// Rotate around Y axis
			const x1 = p.x * cosA - p.z * sinA;
			const z1 = p.x * sinA + p.z * cosA;
			// Rotate around X axis
			const y1 = p.y * cosB - z1 * sinB;
			const z2 = p.y * sinB + z1 * cosB;

			const perspective = 800;
			const scale = perspective / (perspective + z2);
			return {
				sx: x1 * scale + w / 2,
				sy: y1 * scale + h / 2,
				scale,
				z: z2,
			};
		}

		function animate() {
			if (!running) return;
			ctx.clearRect(0, 0, w, h);
			angle += ROTATION_SPEED;

			// Update positions
			for (const p of particles) {
				p.x += p.vx;
				p.y += p.vy;
				p.z += p.vz;
				if (Math.abs(p.x) > w * 0.6) p.vx *= -1;
				if (Math.abs(p.y) > h * 0.6) p.vy *= -1;
				if (Math.abs(p.z) > 200) p.vz *= -1;
			}

			// Project and sort by depth. Drop particles whose rotated z falls
			// behind the camera plane (perspective = 800) -- their `scale`
			// goes negative, which would yield negative arc radii.
			const projected = particles
				.map((p, i) => ({ ...project(p), i, p }))
				.filter((pp) => pp.scale > 0);
			projected.sort((a, b) => a.z - b.z);

			// Draw connections
			for (let i = 0; i < projected.length; i++) {
				for (let j = i + 1; j < projected.length; j++) {
					const a = projected[i];
					const b = projected[j];
					const dx = a.sx - b.sx;
					const dy = a.sy - b.sy;
					const dist = Math.sqrt(dx * dx + dy * dy);
					if (dist < CONNECTION_DIST) {
						const alpha = (1 - dist / CONNECTION_DIST) * 0.15 * Math.min(a.scale, b.scale);
						ctx.beginPath();
						ctx.moveTo(a.sx, a.sy);
						ctx.lineTo(b.sx, b.sy);
						ctx.strokeStyle = withAlpha(connectionPigment, alpha);
						ctx.lineWidth = 0.5;
						ctx.stroke();
					}
				}
			}

			// Draw particles
			for (const { sx, sy, scale, p } of projected) {
				ctx.beginPath();
				ctx.arc(sx, sy, p.size * scale, 0, Math.PI * 2);
				ctx.fillStyle = p.color;
				ctx.fill();
			}

			animRef.current = requestAnimationFrame(animate);
		}

		animRef.current = requestAnimationFrame(animate);

		// Pause the RAF loop when the hero (and therefore the canvas) is offscreen.
		// Saves a real amount of battery on mobile -- the connection-distance check
		// is O(n^2) over 60 particles every frame.
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !running) {
					running = true;
					animRef.current = requestAnimationFrame(animate);
				} else if (!entry.isIntersecting && running) {
					running = false;
					cancelAnimationFrame(animRef.current);
				}
			},
			{ threshold: 0 },
		);
		io.observe(canvas);

		return () => {
			running = false;
			io.disconnect();
			cancelAnimationFrame(animRef.current);
			window.removeEventListener("resize", resize);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="absolute inset-0 z-0 h-full w-full pointer-events-none opacity-60"
		/>
	);
}
