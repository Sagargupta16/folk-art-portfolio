import { requireAdminPage } from "@/lib/admin-auth";
import { getAllArtworks, getAllCategories } from "@/lib/data";
import { AdminPageHeader } from "../_components/admin-page-header";
import { CategoryManager } from "../_components/category-manager";

export default async function AdminCategoriesPage() {
	await requireAdminPage();
	const [cats, artworks] = await Promise.all([getAllCategories(), getAllArtworks()]);

	// Count how many artworks use each category name (delete guard + hint).
	const usage: Record<string, number> = {};
	for (const a of artworks) {
		usage[a.style] = (usage[a.style] ?? 0) + 1;
	}

	return (
		<div className="max-w-2xl space-y-6">
			<AdminPageHeader
				title="Categories"
				description="The art styles a piece can belong to. They drive the gallery filter, the custom-order style picker, and the hero chips. Drag to reorder. A category in use can't be deleted until its pieces are reassigned."
			/>
			<CategoryManager categories={[...cats]} usage={usage} />
		</div>
	);
}
