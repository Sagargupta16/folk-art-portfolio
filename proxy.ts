/**
 * Route protection for the admin panel (Next 16 proxy.ts, formerly middleware.ts).
 *
 * Wraps every /admin request with the Auth.js session check: an unauthenticated
 * visitor is redirected to the branded /login page, then back. The signIn
 * callback in auth.ts further restricts WHO may complete login (maintainers
 * table). Private page reads and server actions separately check the current
 * allowlist through lib/admin-auth.ts, including after a session is revoked.
 *
 * The Auth.js `auth()` wrapper supplies the default export Next runs as the
 * proxy; `config.matcher` scopes it to /admin. Runs on the Node.js runtime.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
	const isAdmin = req.nextUrl.pathname.startsWith("/admin");
	if (isAdmin && !req.auth) {
		const loginUrl = new URL("/login", req.nextUrl.origin);
		loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
		return NextResponse.redirect(loginUrl);
	}
	return NextResponse.next();
});

export const config = {
	matcher: ["/admin/:path*"],
};
