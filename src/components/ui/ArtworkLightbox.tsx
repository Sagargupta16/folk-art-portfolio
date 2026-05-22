import { useEffect, useRef } from "react";

type LightboxItem = {
	slug: string;
	title: string;
	style: string;
	medium: string;
	year: number | null;
	description: string | null;
	alt: string;
	origUrl: string;
	avifSrcset: string;
	webpSrcset: string;
	palette?: string[];
	accentVar: string;
};

type Props = {
	item: LightboxItem | null;
	onClose: () => void;
	onPrev: () => void;
	onNext: () => void;
};

export default function ArtworkLightbox({
	item,
	onClose,
	onPrev,
	onNext,
}: Props) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (item && !dialog.open) {
			dialog.showModal();
		} else if (!item && dialog.open) {
			dialog.close();
		}
	}, [item]);

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (!item) return;
			if (e.key === "ArrowLeft") onPrev();
			else if (e.key === "ArrowRight") onNext();
		}
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [item, onPrev, onNext]);

	return (
		<dialog
			ref={dialogRef}
			className="artwork-lightbox bg-transparent p-0 backdrop:bg-[var(--color-ink)]/85 backdrop:backdrop-blur-sm"
			aria-labelledby="lightbox-title"
			onClick={(e) => {
				if (e.target === dialogRef.current) onClose();
			}}
			onClose={onClose}
		>
			{item && (
				<div className="relative mx-auto flex max-h-[90vh] w-[min(94vw,1100px)] flex-col overflow-hidden border border-[var(--color-line)] bg-[var(--color-bg)] md:flex-row">
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
					>
						<svg
							viewBox="0 0 20 20"
							width="14"
							height="14"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.8"
							strokeLinecap="round"
						>
							<line x1="4" y1="4" x2="16" y2="16" />
							<line x1="16" y1="4" x2="4" y2="16" />
						</svg>
					</button>

					<div className="lightbox-image relative flex min-h-[50vh] flex-1 items-center justify-center bg-[var(--color-bg-soft)] md:min-h-[70vh]">
						<picture className="block h-full w-full">
							{item.avifSrcset && (
								<source type="image/avif" srcSet={item.avifSrcset} />
							)}
							{item.webpSrcset && (
								<source type="image/webp" srcSet={item.webpSrcset} />
							)}
							<img
								src={item.origUrl}
								alt={item.alt}
								className="block h-full max-h-[90vh] w-full object-contain"
							/>
						</picture>

						<button
							type="button"
							onClick={onPrev}
							aria-label="Previous artwork"
							className="lightbox-nav absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[var(--color-line)] bg-[var(--color-bg)]/85 text-[var(--color-ink)] backdrop-blur transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
						>
							<svg
								viewBox="0 0 20 20"
								width="14"
								height="14"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.8"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<polyline points="12 5 6 10 12 15" />
							</svg>
						</button>
						<button
							type="button"
							onClick={onNext}
							aria-label="Next artwork"
							className="lightbox-nav absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-[var(--color-line)] bg-[var(--color-bg)]/85 text-[var(--color-ink)] backdrop-blur transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
						>
							<svg
								viewBox="0 0 20 20"
								width="14"
								height="14"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.8"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<polyline points="8 5 14 10 8 15" />
							</svg>
						</button>
					</div>

					<aside className="flex max-w-md flex-col gap-4 border-t border-[var(--color-line)] p-6 md:max-w-sm md:border-l md:border-t-0 md:p-8">
						<p className="t-eyebrow" style={{ color: item.accentVar }}>
							{item.style}
						</p>
						<h2
							id="lightbox-title"
							className="t-display text-3xl text-[var(--color-ink)] sm:text-4xl"
						>
							{item.title}
						</h2>
						{item.description && (
							<p className="t-body text-[var(--color-muted)]">
								{item.description}
							</p>
						)}
						<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 pt-2 text-sm">
							<dt className="t-meta">Medium</dt>
							<dd className="text-[var(--color-ink)]">{item.medium}</dd>
							{item.year && (
								<>
									<dt className="t-meta">Year</dt>
									<dd className="text-[var(--color-ink)]">{item.year}</dd>
								</>
							)}
						</dl>
						{item.palette && item.palette.length > 0 && (
							<div className="mt-2">
								<p className="t-meta mb-2">Palette</p>
								<div
									className="chromacard"
									role="img"
									aria-label="Sampled palette"
								>
									{item.palette.map((hex, i) => (
										<span
											key={i}
											style={{ background: hex }}
											aria-hidden="true"
										/>
									))}
								</div>
							</div>
						)}
					</aside>
				</div>
			)}
		</dialog>
	);
}
