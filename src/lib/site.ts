import artworksData from "@/data/artworks.json";
import siteData from "@/data/site.json";
import type { Artwork } from "./images";

export type ArtStyle = (typeof siteData.styles)[number];

export type Workshop = {
	slug: string;
	title: string;
	blurb: string;
	durationHours?: number;
	order: number;
};

export const site = siteData;
export const styles = siteData.styles as readonly ArtStyle[];
export const nav = siteData.nav;
export const brand = siteData.brand;
export const contact = siteData.contact;
export const sections = siteData.sections;

/** Typed view over the artworks catalog. Sorted by `order` ascending. */
export const artworks: readonly Artwork[] = (artworksData.items as Artwork[])
	.slice()
	.sort((a, b) => a.order - b.order);

/** Typed view over the workshops list. Sorted by `order` ascending. */
export const workshops: readonly Workshop[] = (siteData.workshops as Workshop[])
	.slice()
	.sort((a, b) => a.order - b.order);
