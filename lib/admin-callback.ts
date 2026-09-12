import { siteConfig } from "./site-config";

const ADMIN_HOME = "/admin";
const SPACE_CODE_POINT = 0x20;

/** Only local admin destinations may be used after sign-in. */
export function safeAdminCallback(value: string | undefined): string {
	if (
		!value?.startsWith("/") ||
		[...value].some(
			(character) => character === "\\" || (character.codePointAt(0) ?? 0) <= SPACE_CODE_POINT,
		)
	) {
		return ADMIN_HOME;
	}
	try {
		const origin = new URL(siteConfig.url).origin;
		const target = new URL(value, origin);
		if (
			target.origin !== origin ||
			!/^\/admin(?:\/|$)/.test(target.pathname) ||
			/%(?:2f|5c)/i.test(target.pathname)
		) {
			return ADMIN_HOME;
		}
		return `${target.pathname}${target.search}`;
	} catch {
		return ADMIN_HOME;
	}
}
