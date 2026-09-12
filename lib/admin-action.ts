import { type ActionResult, failure } from "./action-result";
import { requireMaintainer } from "./admin-auth";

export function runAdminAction<T extends object>(
	operation: () => Promise<T>,
): Promise<ActionResult<T>>;
export function runAdminAction(operation: () => Promise<void>): Promise<ActionResult>;

/** Return expected failures as data so production clients can reconcile their state. */
export async function runAdminAction(operation: () => Promise<unknown>): Promise<ActionResult> {
	try {
		await requireMaintainer();
		return { ok: true, ...((await operation()) as object | undefined) };
	} catch (error) {
		return failure(error);
	}
}
