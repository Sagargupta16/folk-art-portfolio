/**
 * Failure envelope for admin server actions.
 *
 * Next.js replaces any error *thrown* inside a server action with a generic
 * "the specific message is omitted in production builds" digest before the
 * client sees it. Our validation messages ("Image must be a JPEG, PNG, or WebP
 * file.") therefore never reached the admin UI in production: every failure,
 * from a wrong file type to a real fault, surfaced as an opaque 500.
 *
 * Returned values are not sanitized, so actions hand their failure back as data
 * and the caller re-throws it in the browser, where messages survive and the
 * existing error UI keeps working unchanged.
 */

/** A failed action, carrying a message safe to show a maintainer. */
export interface Failure {
	ok: false;
	message: string;
}

/** A successful action, plus whatever payload it returns. */
export type Success<T> = { ok: true } & T;

export type ActionResult<T = unknown> = Success<T> | Failure;

const DATABASE_MESSAGES: Record<string, string> = {
	"23505": "An item with that name or identifier already exists.",
	"23503": "The selected category no longer exists. Refresh and choose a category.",
	"23001": "This category is still used by artwork. Reassign the pieces first.",
	"23514": "A value does not meet the catalog rules. Check the form and try again.",
};
const MAX_ERROR_CAUSES = 4;
const RETRY_MESSAGE = "Something went wrong. Please try again.";

/** Wrap a caught error as a failure the client can display. */
export function failure(error: unknown): Failure {
	let current = error;
	for (let depth = 0; depth < MAX_ERROR_CAUSES && current && typeof current === "object"; depth++) {
		const details = current as { code?: unknown; cause?: unknown };
		if (typeof details.code === "string") {
			return { ok: false, message: DATABASE_MESSAGES[details.code] ?? RETRY_MESSAGE };
		}
		current = details.cause;
	}
	return {
		ok: false,
		message:
			error instanceof Error && error.name === "Error" && !error.cause
				? error.message
				: RETRY_MESSAGE,
	};
}

/**
 * Unwrap an action result in the browser: return the payload, or throw the
 * server's real message so the calling component's catch shows it.
 */
export function unwrap<T>(result: ActionResult<T>): Success<T> {
	if (!result.ok) throw new Error(result.message);
	return result;
}

/**
 * Recognise a failure envelope in an unknown action return value, so the shared
 * admin transition helper can surface it without every call site opting in.
 * Actions that still return void are unaffected.
 */
export function isFailure(value: unknown): value is Failure {
	return (
		typeof value === "object" &&
		value !== null &&
		(value as { ok?: unknown }).ok === false &&
		typeof (value as { message?: unknown }).message === "string"
	);
}
