import { requireAdminPage } from "@/lib/admin-auth";
import { getAllWorkshops } from "@/lib/data";
import { AdminPageHeader } from "../_components/admin-page-header";
import { WorkshopManager } from "../_components/workshop-manager";

export default async function AdminWorkshopsPage() {
	await requireAdminPage();
	const workshops = await getAllWorkshops();

	return (
		<div className="max-w-3xl space-y-6">
			<AdminPageHeader
				title="Workshops"
				description="Add, edit, reorder, and remove the sessions shown on the public site. Drag to reorder."
			/>
			<WorkshopManager workshops={[...workshops]} />
		</div>
	);
}
