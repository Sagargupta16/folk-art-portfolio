export interface SiteSettings {
	profileImage: string;
	showHomeIntro: boolean;
}

/** Ignore malformed stored values instead of trusting a caller's type assertion. */
export function parseSetting<K extends keyof SiteSettings>(
	key: K,
	value: unknown,
): SiteSettings[K] | undefined {
	const expected = key === "showHomeIntro" ? "boolean" : "string";
	return typeof value === expected ? (value as SiteSettings[K]) : undefined;
}
