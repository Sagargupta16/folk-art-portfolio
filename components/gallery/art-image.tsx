"use client";

import { ImageOff } from "lucide-react";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * Client-side wrapper around next/image that renders a soft placeholder
 * when the asset 404s. Used for catalog artwork: a typo in
 * `data/artworks.json` (or a missing file in public/artworks/) would
 * otherwise show the browser's broken-image icon site-wide.
 *
 * `next/image` with `unoptimized: true` (Phase 1 static export) emits a
 * plain <img>, so `onError` fires reliably on a 404.
 */
export function ArtImage(props: ImageProps) {
	const [failed, setFailed] = useState(false);

	if (failed) {
		return (
			<div
				role="img"
				aria-label={typeof props.alt === "string" ? props.alt : "Artwork unavailable"}
				className="absolute inset-0 grid place-items-center bg-bg-soft text-muted"
			>
				<ImageOff size={28} aria-hidden="true" />
			</div>
		);
	}

	return <Image {...props} onError={() => setFailed(true)} />;
}
