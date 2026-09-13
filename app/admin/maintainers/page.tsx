import { requireAdminPage } from "@/lib/admin-auth";
import { getMaintainers } from "@/lib/data";
import { AdminPageHeader } from "../_components/admin-page-header";
import { MaintainerManager } from "../_components/maintainer-manager";

export default async function MaintainersPage() {
	const me = await requireAdminPage();
	const roster = await getMaintainers();

	return (
		<div className="max-w-2xl space-y-6">
			<AdminPageHeader
				title="Maintainers"
				description="Anyone listed here can sign in and manage the catalog. Add by Google email."
			/>
			<MaintainerManager
				roster={roster.map((m) => ({
					email: m.email,
					name: m.name,
					isRoot: m.isRoot,
					addedBy: m.addedBy,
				}))}
				me={me}
			/>
		</div>
	);
}
