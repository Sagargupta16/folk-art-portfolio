import { getSite } from "@/lib/data";
import { SiteHeaderClient } from "./site-header-client";

/**
 * Server wrapper for the top bar. Reads the brand mark pieces from
 * `data/site.json` and hands them to the Client island. Keeps the page
 * shell server-rendered; only the menu toggle is hydrated client-side.
 */
export function SiteHeader() {
	const { brand } = getSite();
	return (
		<SiteHeaderClient
			brandLatinPrefix={brand.headline.latinPrefix}
			brandDevanagariCore={brand.headline.devanagariCore}
			brandConnector={brand.headline.connector}
			brandSuffix={brand.headline.suffix}
		/>
	);
}
