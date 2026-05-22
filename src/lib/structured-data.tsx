import artworksData from "@/data/artworks.json";
import { type Artwork, artworkUrl } from "./images";
import { brand, contact } from "./site";

const SITE = "https://sagargupta.online";
const BASE = import.meta.env.BASE_URL;

function buildHomepageGraph() {
	const artworks = artworksData.items as Artwork[];
	const homepageUrl = new URL(BASE, SITE).toString();
	const artistId = `${homepageUrl}#artist`;

	const sameAs = [contact.instagram.url, contact.whatsapp.url].filter(Boolean);

	const artist = {
		"@type": ["Person", "VisualArtist"],
		"@id": artistId,
		name: brand.title,
		alternateName: brand.publicName,
		description: brand.description,
		jobTitle: brand.tagline,
		address: {
			"@type": "PostalAddress",
			addressCountry: "IN",
			addressLocality: brand.location,
		},
		knowsAbout: [
			"Madhubani painting",
			"Pichwai painting",
			"Lippan art",
			"Gond painting",
			"Indian folk art",
		],
		sameAs,
		email: contact.email.url.replace(/^mailto:/, ""),
		url: homepageUrl,
		image: new URL(`${BASE}${brand.logo}`, SITE).toString(),
	};

	const website = {
		"@type": "WebSite",
		"@id": `${homepageUrl}#website`,
		url: homepageUrl,
		name: brand.publicName,
		alternateName: brand.title,
		description: brand.description,
		inLanguage: "en-IN",
		publisher: { "@id": artistId },
	};

	const paintings = artworks.map((a) => ({
		"@type": "VisualArtwork",
		name: a.title,
		description:
			a.description ?? `${a.title}, ${a.style} painting in ${a.medium}.`,
		artform: a.style,
		artMedium: a.medium,
		image: new URL(artworkUrl(a, BASE), SITE).toString(),
		creator: { "@id": artistId },
		url: homepageUrl,
	}));

	return {
		"@context": "https://schema.org",
		"@graph": [artist, website, ...paintings],
	};
}

export function StructuredData() {
	const graph = buildHomepageGraph();
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
		/>
	);
}
