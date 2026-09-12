import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-auth";
import { getLeadsPage } from "@/lib/data";
import { AdminPageHeader } from "../_components/admin-page-header";
import { LeadsManager } from "../_components/leads-manager";

// Admin queue: always render fresh, never prerender/cache. (Also keeps the
// build from querying the leads table before its migration is applied.)
export const dynamic = "force-dynamic";

export default async function AdminLeadsPage({
	searchParams,
}: Readonly<{ searchParams: Promise<{ page?: string }> }>) {
	await requireAdminPage();
	const requestedPage = Number((await searchParams).page ?? 1);
	const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
	const { leads, hasNextPage } = await getLeadsPage(page);

	return (
		<div className="max-w-3xl space-y-6">
			<AdminPageHeader
				title="Leads"
				description="Saved custom-order enquiries, newest first. Use the supplied contact details to reply, mark each as contacted or closed, and delete once you no longer need it."
			/>
			<LeadsManager leads={[...leads]} />
			{page > 1 || hasNextPage ? (
				<nav aria-label="Lead pages" className="flex items-center justify-between gap-4 text-sm">
					{page > 1 ? (
						<Link href={`/admin/leads?page=${page - 1}`} className="underline underline-offset-4">
							Newer enquiries
						</Link>
					) : (
						<span />
					)}
					<span>Page {page}</span>
					{hasNextPage ? (
						<Link href={`/admin/leads?page=${page + 1}`} className="underline underline-offset-4">
							Older enquiries
						</Link>
					) : (
						<span />
					)}
				</nav>
			) : null}
		</div>
	);
}
