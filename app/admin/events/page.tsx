import { requireAdminPage } from "@/lib/admin-auth";
import { getAllEvents } from "@/lib/data";
import { AdminPageHeader } from "../_components/admin-page-header";
import { EventsManager } from "../_components/events-manager";

/** An event batch processes up to 12 masters in one action; see app/admin/page.tsx. */
export const maxDuration = 60;

export default async function AdminEventsPage() {
	await requireAdminPage();
	const events = await getAllEvents();

	return (
		<div className="max-w-3xl space-y-6">
			<AdminPageHeader
				title="Events"
				description="Add workshops held, exhibitions, classes, and gatherings. Each event is a photo gallery. The public page shows newest first; pin one to keep it at the top."
			/>
			<EventsManager events={[...events]} />
		</div>
	);
}
