/**
 * Shown when a non-maintainer Google account completes Google sign-in but
 * fails the maintainer allowlist check in auth.ts (configured as Auth.js's
 * `pages.error`). Explains the situation and offers a way to request access
 * from the root maintainer. No auto-redirect -- a manual "Back to site" link.
 */
import { Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/auth";
import { GmailIcon } from "@/components/ui/brand-icons";
import { buttonVariants } from "@/components/ui/button";
import { getSite } from "@/lib/data";
import { getRootMaintainerEmail } from "@/lib/maintainers";

export const metadata: Metadata = {
	title: "Access not granted",
	robots: { index: false, follow: false },
};

interface AccessDeniedPageProps {
	searchParams: Promise<{ error?: string }>;
}

export default async function AccessDeniedPage({ searchParams }: Readonly<AccessDeniedPageProps>) {
	const { error } = await searchParams;
	const isConfigurationError = error === "Configuration";
	const { brand } = getSite();
	const rootEmail = await getRootMaintainerEmail().catch(() => null);
	const subject = isConfigurationError ? "Admin sign-in issue" : "Maintainer access request";
	const mailto = rootEmail ? `mailto:${rootEmail}?subject=${encodeURIComponent(subject)}` : null;

	return (
		<main className="grid min-h-dvh place-items-center px-(--container-px) py-16">
			<div className="w-full max-w-md text-center">
				<Link
					href="/"
					className="t-display inline-block text-3xl leading-none transition-colors hover:text-accent"
				>
					<span className="not-italic">{brand.headline.latinPrefix}</span>
					<span lang="hi" className="font-devanagari not-italic text-accent">
						{brand.headline.devanagariCore}
					</span>
				</Link>

				<div className="mt-10 grid h-14 w-14 mx-auto place-items-center rounded-full bg-bg-soft text-accent ring-1 ring-line">
					<Lock size={22} aria-hidden="true" />
				</div>

				<h1 className="t-display mt-6 text-2xl sm:text-3xl">
					{isConfigurationError ? "Sign-in unavailable" : "Access not granted"}
				</h1>
				<p className="t-lead mt-3 text-sm">
					{isConfigurationError
						? "The site could not verify maintainer access because an authentication service is unavailable. Try again shortly or report the issue to the site owner."
						: "This Google account isn’t on the maintainer list, so it can’t open the admin panel. If you should have access, ask the site owner to add you."}
				</p>

				{mailto ? (
					<a
						href={mailto}
						className="mt-6 inline-flex items-center gap-2 rounded-(--radius-sm) border border-line bg-bg px-4 py-2.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
					>
						<GmailIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
						{isConfigurationError ? "Report issue to" : "Request access from"} {rootEmail}
					</a>
				) : null}

				<div className="mt-10 flex flex-wrap items-center justify-center gap-3">
					<Link href="/" className={buttonVariants({ variant: "primary" })}>
						Back to site
					</Link>
					<form
						action={async () => {
							"use server";
							await signOut({ redirectTo: "/login" });
						}}
					>
						<button type="submit" className={buttonVariants({ variant: "ghost" })}>
							{isConfigurationError ? "Try sign-in again" : "Try a different account"}
						</button>
					</form>
				</div>
			</div>
		</main>
	);
}
