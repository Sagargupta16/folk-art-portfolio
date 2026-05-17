import type { ArtStyle } from './site';

export interface Artwork {
  slug: string;
  title: string;
  style: ArtStyle;
  medium: string;
  year?: number;
  dimensions?: string;
  aspectRatio: number;
  featured: boolean;
  order: number;
  description?: string;
  image: string;
}

/* Build the public URL for an artwork's image, given the site's base URL. */
export function artworkUrl(art: Artwork, baseUrl: string): string {
  const trimmedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${trimmedBase}artworks/${art.image}`;
}
