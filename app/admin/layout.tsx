import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/auth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { requireAdminPage } from "@/lib/admin-auth";
import { AdminNavDesktop, AdminNavMobile } from "./_components/admin-nav";
import { ConfirmProvider } from "./_components/confirm-dialog";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

/** Up to two initials from an email's local part (e.g. "sg85207" -> "SG"). */
function initials(email: string): string {
	const local = email.split("@")[0] ?? email;
	const letters = local.replace(/[^a-zA-Z]/g, "");
	return (letters.slice(0, 2) || local.slice(0, 2)).toUpperCase();
}

export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
	const email = await requireAdminPage();

	return (
		<ConfirmProvider>
			<div className="min-h-dvh bg-bg-soft">
				<header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur-md">
					<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-(--container-px) py-2.5">
						<Link
							href="/admin"
							className="flex min-h-11 items-center gap-2.5 rounded-(--radius-sm) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
						>
							<span className="grid h-9 w-9 place-items-center rounded-(--radius-sm) bg-accent text-bg">
								<Settings size={16} aria-hidden="true" />
							</span>
							<span className="text-sm font-semibold">Kalchar Admin</span>
						</Link>
						<div className="flex items-center gap-2.5">
							<ThemeToggle compact />
							<span
								role="img"
								title={email}
								aria-label={`Signed in as ${email}`}
								className="grid h-9 w-9 place-items-center rounded-full bg-bg-muted text-xs font-semibold uppercase text-ink ring-1 ring-line"
							>
								{initials(email)}
							</span>
							<form
								action={async () => {
									"use server";
									await signOut({ redirectTo: "/" });
								}}
							>
								<button
									type="submit"
									aria-label="Sign out"
									title="Sign out"
									className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-(--radius-sm) border border-line bg-bg px-3 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
								>
									<LogOut size={14} aria-hidden="true" />
									<span className="hidden sm:inline">Sign out</span>
								</button>
							</form>
						</div>
					</div>
					<div className="hidden border-t border-line/70 xl:block">
						<div className="mx-auto max-w-6xl px-(--container-px)">
							<AdminNavDesktop />
						</div>
					</div>
				</header>

				<main className="mx-auto max-w-6xl px-(--container-px) pt-6 pb-28 sm:pt-8 xl:pb-10">
					{children}
				</main>

				<AdminNavMobile />
			</div>
		</ConfirmProvider>
	);
}
