/**
 * Maintainer sign-in page.
 *
 * Lives OUTSIDE the /admin matcher (proxy.ts gates /admin/:path*), so it is
 * reachable while logged out without an infinite redirect loop. The proxy and
 * the admin layout both send unauthenticated visitors here.
 *
 * Google is the only provider. The button is a server-action form calling
 * Auth.js `signIn`, so it works with no client JS. The signIn callback in
 * auth.ts still decides WHO may complete login (the maintainers allowlist); a
 * non-maintainer Google account is bounced back here with `?error`.
 */
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { GoogleIcon } from "@/components/ui/brand-icons";
import { buttonVariants } from "@/components/ui/button";
import { getAdminAccess } from "@/lib/admin-auth";
import { safeAdminCallback } from "@/lib/admin-callback";
import { getSite } from "@/lib/data";

export const metadata: Metadata = {
	title: "Maintainer sign-in",
	robots: { index: false, follow: false },
};

interface LoginPageProps {
	searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: Readonly<LoginPageProps>) {
	const { callbackUrl, error } = await searchParams;
	const { brand } = getSite();
	const redirectTo = safeAdminCallback(callbackUrl);

	// Already signed in: skip the form, go where they were headed.
	const { email, allowed } = await getAdminAccess();
	if (email) redirect(allowed ? redirectTo : "/access-denied");

	return (
		<main className="grid min-h-dvh place-items-center px-(--container-px) py-16">
			<div className="w-full max-w-sm text-center">
				<Link
					href="/"
					className="t-display inline-block text-3xl leading-none transition-colors hover:text-accent"
				>
					<span className="not-italic">{brand.headline.latinPrefix}</span>
					<span lang="hi" className="font-devanagari not-italic text-accent">
						{brand.headline.devanagariCore}
					</span>
				</Link>

				<h1 className="t-display mt-8 text-2xl">Maintainer sign-in</h1>
				<p className="t-lead mt-2 text-sm">
					Access is limited to listed maintainers. Sign in with the Google account on the allowlist.
				</p>

				{error ? (
					<p className="mt-6 rounded-(--radius-md) border border-ruby/40 bg-bg-soft px-4 py-3 text-sm text-ruby">
						That account is not on the maintainer list. Ask an existing maintainer to add you, then
						try again.
					</p>
				) : null}

				<form
					action={async () => {
						"use server";
						await signIn("google", { redirectTo });
					}}
					className="mt-8"
				>
					<button type="submit" className={buttonVariants({ variant: "ghost", size: "lg" })}>
						<GoogleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
						Continue with Google
					</button>
				</form>

				<Link
					href="/"
					className="group mt-8 inline-flex items-center gap-1.5 text-xs uppercase tracking-meta text-muted transition-colors hover:text-ink"
				>
					<ArrowLeft
						size={12}
						aria-hidden="true"
						className="transition-transform duration-(--duration-base) ease-(--ease-out) group-hover:-translate-x-0.5"
					/>
					Back to site
				</Link>
			</div>
		</main>
	);
}
