"use client";

import { createContext, useContext, useState } from "react";
import type { Artwork } from "@/lib/types";

interface LightboxContextType {
	isOpen: boolean;
	activeArtwork: Artwork | null;
	artworksList: Artwork[];
	openLightbox: (artwork: Artwork, list?: Artwork[]) => void;
	closeLightbox: () => void;
	nextArtwork: () => void;
	prevArtwork: () => void;
}

const LightboxContext = createContext<LightboxContextType | undefined>(undefined);

export function LightboxProvider({ children }: { children: React.ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);
	const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null);
	const [artworksList, setArtworksList] = useState<Artwork[]>([]);

	const openLightbox = (artwork: Artwork, list: Artwork[] = []) => {
		setActiveArtwork(artwork);
		setArtworksList(list.length > 0 ? list : [artwork]);
		setIsOpen(true);
	};

	const closeLightbox = () => {
		setIsOpen(false);
		setActiveArtwork(null);
	};

	const nextArtwork = () => {
		if (artworksList.length <= 1 || !activeArtwork) return;
		const currentIndex = artworksList.findIndex((a) => a.slug === activeArtwork.slug);
		if (currentIndex === -1) return;
		const nextIndex = (currentIndex + 1) % artworksList.length;
		const nextArt = artworksList[nextIndex];
		if (nextArt) setActiveArtwork(nextArt);
	};

	const prevArtwork = () => {
		if (artworksList.length <= 1 || !activeArtwork) return;
		const currentIndex = artworksList.findIndex((a) => a.slug === activeArtwork.slug);
		if (currentIndex === -1) return;
		const prevIndex = (currentIndex - 1 + artworksList.length) % artworksList.length;
		const prevArt = artworksList[prevIndex];
		if (prevArt) setActiveArtwork(prevArt);
	};

	return (
		<LightboxContext.Provider
			value={{
				isOpen,
				activeArtwork,
				artworksList,
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
