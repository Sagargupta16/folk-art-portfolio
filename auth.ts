/**
 * Auth.js v5 (NextAuth) config -- Google sign-in gated to the maintainer roster.
 *
 * Login is allowed only for emails in the `maintainers` DB table (see
 * lib/maintainers.ts). A root is provisioned separately during admin setup;
 * catalog bootstrap never changes the roster. Access is editable from /admin.
 *
 * Env vars (see .env.example):
 *   AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET
 *
 * Auth.js auto-reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET for the Google
 * provider, so no explicit clientId/clientSecret wiring is needed.
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isMaintainer } from "@/lib/maintainers";

export const { handlers, signIn, signOut, auth } = NextAuth({
	// Trust the deployment host. Vercel is auto-trusted in production, but a
	// self-hosted / local `next start` run is not, and without this Auth.js
	// throws UntrustedHost on every /api/auth call (sign-in fails entirely).
	// Safe here: the app runs behind Vercel's host in prod and localhost in dev.
	trustHost: true,
	providers: [
		Google({
			// Always show Google's account chooser instead of silently reusing the
			// browser's current Google session. Without this, a signed-in
			// non-maintainer is bounced to /access-denied and "Try a different
			// account" just re-submits the same account in a loop -- the chooser
			// is what lets them pick a maintainer account.
			authorization: { params: { prompt: "select_account" } },
		}),
	],
	pages: {
		// A non-maintainer Google account fails the signIn callback below;
		// Auth.js sends them here instead of the default NextAuth error screen.
		error: "/access-denied",
	},
	callbacks: {
		async signIn({ profile }) {
			// Explicit deny when the provider returns no email (scope change,
			// provider quirk) -- never let that case reach the roster lookup.
			const email = profile?.email;
			if (!email) return false;
			return await isMaintainer(email);
		},
	},
});
