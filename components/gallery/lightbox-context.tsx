"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { Artwork } from "@/lib/types";

interface LightboxContextType {
	isOpen: boolean;
	activeArtwork: Artwork | null;
	artworksList: Artwork[];
	/** WhatsApp phone (E.164, no `+`) for the enquiry CTA. Supplied server-side. */
	whatsappPhone: string;
	openLightbox: (artwork: Artwork, list?: Artwork[]) => void;
	closeLightbox: () => void;
	nextArtwork: () => void;
	prevArtwork: () => void;
}

const LightboxContext = createContext<LightboxContextType | undefined>(undefined);

/**
 * `whatsappPhone` is read once on the server (from the data seam) and passed
 * in, so the client-side lightbox never reaches through the seam itself --
 * which keeps the Phase 2 DB swap a server-only change.
 */
export function LightboxProvider({
	children,
	whatsappPhone,
}: {
	children: React.ReactNode;
	whatsappPhone: string;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null);
	const [artworksList, setArtworksList] = useState<Artwork[]>([]);

	// Mirror the latest active piece + list in a ref so the navigation callbacks
	// can read current state without listing it as a dependency. That keeps the
	// callbacks' identities stable across renders, so the lightbox's keydown /
	// focus effects don't tear down and rebuild on every navigation (which would
	// thrash keyboard focus). Pure-read updaters keep this StrictMode-safe.
	const activeRef = useRef<Artwork | null>(null);
	const listRef = useRef<Artwork[]>([]);
	activeRef.current = activeArtwork;
	listRef.current = artworksList;

	const openLightbox = useCallback((artwork: Artwork, list: Artwork[] = []) => {
		setActiveArtwork(artwork);
		setArtworksList(list.length > 0 ? list : [artwork]);
		setIsOpen(true);
	}, []);

	const closeLightbox = useCallback(() => {
		setIsOpen(false);
		setActiveArtwork(null);
	}, []);

	const step = useCallback((dir: 1 | -1) => {
		const list = listRef.current;
		const current = activeRef.current;
		if (list.length <= 1 || !current) return;
		const i = list.findIndex((a) => a.slug === current.slug);
		if (i === -1) return;
		const target = list[(i + dir + list.length) % list.length];
		if (target) setActiveArtwork(target);
	}, []);

	const nextArtwork = useCallback(() => step(1), [step]);
	const prevArtwork = useCallback(() => step(-1), [step]);

	return (
		<LightboxContext.Provider
			value={{
				isOpen,
				activeArtwork,
				artworksList,
				whatsappPhone,
				openLightbox,
				closeLightbox,
				nextArtwork,
				prevArtwork,
			}}
		>
			{children}
		</LightboxContext.Provider>
	);
}

export function useLightbox() {
	const context = useContext(LightboxContext);
	if (!context) {
		throw new Error("useLightbox must be used within a LightboxProvider");
	}
	return context;
}
