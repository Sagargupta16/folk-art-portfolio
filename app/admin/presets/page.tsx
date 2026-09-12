import { requireAdminPage } from "@/lib/admin-auth";
import { getAllOrderPresets } from "@/lib/data";
import { AdminPageHeader } from "../_components/admin-page-header";
import { PresetManager } from "../_components/preset-manager";

export default async function AdminPresetsPage() {
	await requireAdminPage();
	const presets = await getAllOrderPresets();

	return (
		<div className="max-w-2xl space-y-6">
			<AdminPageHeader
				title="Custom-order presets"
				description="The dropdown options on the custom-order form. Add, rename, reorder, or remove them. Drag to reorder within a group."
			/>
			<PresetManager presets={[...presets]} />
		</div>
	);
}
