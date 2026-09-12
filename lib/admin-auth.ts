import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { isMaintainer } from "./maintainers";

/** Request-scoped only: a later navigation or action checks the roster again. */
export const getAdminAccess = cache(async () => {
	const session = await auth();
	const email = session?.user?.email?.trim().toLowerCase() ?? null;
	return { email, allowed: email !== null && (await isMaintainer(email)) };
});

/** Check authorization at the private read or mutation, including direct calls. */
export async function requireMaintainer(): Promise<string> {
	const { email, allowed } = await getAdminAccess();
	if (!email || !allowed) throw new Error("Not authorized.");
	return email;
}

/** Page guards redirect before loading any admin data. */
export async function requireAdminPage(): Promise<string> {
	const { email, allowed } = await getAdminAccess();
	if (!email) redirect("/login?callbackUrl=/admin");
	if (!allowed) redirect("/access-denied");
	return email;
}
