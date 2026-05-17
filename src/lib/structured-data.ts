import type { CollectionEntry } from 'astro:content';
import { brand, contact } from './site';
import { artworkUrl, type Artwork } from './images';

interface BuildOptions {
  artworks: CollectionEntry<'artworks'>[];
  /** Absolute origin including protocol, e.g. https://sagargupta.online */
  siteUrl: string;
  /** Path with trailing slash, e.g. /folk-art-portfolio/ */
  baseUrl: string;
}

/**
 * Build a schema.org @graph for the homepage:
 *   - Person (the artist) with sameAs links to public profiles
 *   - WebSite (the portfolio itself)
 *   - VisualArtwork entries for each piece in the catalog
 *
 * Emit the result inside <script type="application/ld+json"> in the page <head>.
 */
export function buildHomepageGraph(opts: BuildOptions) {
  const { artworks, siteUrl, baseUrl } = opts;

  const homepageUrl = new URL(baseUrl, siteUrl).toString();
  const artistId = `${homepageUrl}#artist`;
  const websiteId = `${homepageUrl}#website`;

  const sameAs = [contact.instagram.url, contact.whatsapp.url].filter(Boolean);

  const artist = {
    '@type': ['Person', 'VisualArtist'],
    '@id': artistId,
    name: brand.title,
    alternateName: brand.publicName,
    description: brand.description,
    jobTitle: brand.tagline,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressLocality: brand.location,
    },
    knowsAbout: ['Madhubani painting', 'Pichwai painting', 'Lippan art', 'Gond painting', 'Indian folk art'],
    sameAs,
    email: contact.email.url.replace(/^mailto:/, ''),
    url: homepageUrl,
    image: new URL(`${baseUrl}${brand.logo}`, siteUrl).toString(),
  };

  const website = {
    '@type': 'WebSite',
    '@id': websiteId,
    url: homepageUrl,
    name: brand.publicName,
    alternateName: brand.title,
    description: brand.description,
    inLanguage: 'en-IN',
    publisher: { '@id': artistId },
  };

  const paintings = artworks.map((entry) => {
    const a = entry.data as Artwork;
    return {
      '@type': 'VisualArtwork',
      name: a.title,
      description: a.description ?? `${a.title}, ${a.style} painting in ${a.medium}.`,
      artform: a.style,
      artMedium: a.medium,
      image: new URL(artworkUrl(a, baseUrl), siteUrl).toString(),
      creator: { '@id': artistId },
      url: homepageUrl,
    };
  });

  return {
    '@context': 'https://schema.org',
    '@graph': [artist, website, ...paintings],
  };
}
