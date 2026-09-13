import { Image, Package, ShoppingBag, Star } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-auth";
import { getAllArtworks, getCategoryNames } from "@/lib/data";
import { artworkBrowserImageUrl } from "@/lib/image-base";
import { AdminPageHeader } from "./_components/admin-page-header";
import { ArtworkGrid } from "./_components/artwork-grid";
import { ArtworkRow } from "./_components/artwork-row";
import { UploadForm } from "./_components/upload-form";

/**
 * Server actions inherit this route's budget. Generating one artwork's variant
 * set is 13 sharp encodes (4 of them AVIF) plus 13 R2 uploads, which overruns
 * the platform default on a large master.
 */
export const maxDuration = 60;

export default async function AdminDashboard() {
	await requireAdminPage();
	const [artworks, categoryNames] = await Promise.all([getAllArtworks(), getCategoryNames()]);
	const available = artworks.filter((a) => a.status === "available").length;
	const sold = artworks.filter((a) => a.status === "sold").length;
	const featured = artworks.filter((a) => a.featured).length;

	return (
		<div className="space-y-8">
			<AdminPageHeader
				title="Pieces"
				description="Your catalog at a glance, plus add, reorder, and manage each piece."
			/>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<StatCard icon={Image} label="Total pieces" value={artworks.length} />
				<StatCard icon={ShoppingBag} label="Available" value={available} />
				<StatCard icon={Package} label="Sold" value={sold} />
				<StatCard icon={Star} label="Featured" value={featured} />
			</div>

			{/* Upload section */}
			<section className="rounded-(--radius-md) border border-line bg-bg p-5 sm:p-6">
				<h2 className="text-sm font-semibold">Add a new piece</h2>
				<UploadForm categories={categoryNames} />
			</section>

			{/* Reorder section */}
			<section className="rounded-(--radius-md) border border-line bg-bg p-5 sm:p-6">
				<div className="mb-4">
					<h2 className="text-sm font-semibold">Gallery order</h2>
					<p className="mt-1 text-xs text-muted">
						Drag pieces to reorder. This controls display order on the public site.
					</p>
				</div>
				<ArtworkGrid
					artworks={artworks.map((a) => ({
						slug: a.slug,
						title: a.title,
						style: a.style,
						status: a.status ?? "archive",
						featured: a.featured,
						priceInr: a.priceInr,
						thumb: artworkBrowserImageUrl(a.image, 400, "webp"),
					}))}
				/>
			</section>

			{/* Detailed management */}
			<section className="rounded-(--radius-md) border border-line bg-bg p-5 sm:p-6">
				<div className="mb-4">
					<h2 className="text-sm font-semibold">Manage pieces</h2>
					<p className="mt-1 text-xs text-muted">
						Tap Edit to change any detail, price, status, image, or to delete a piece.
					</p>
				</div>
				<div className="space-y-2">
					{artworks.map((art) => (
						<ArtworkRow
							key={art.slug}
							art={art}
							thumb={artworkBrowserImageUrl(art.image, 400, "webp")}
							categories={categoryNames}
						/>
					))}
				</div>
			</section>
		</div>
	);
}

function StatCard({
	icon: Icon,
	label,
	value,
}: Readonly<{ icon: typeof Image; label: string; value: number }>) {
	return (
		<div className="rounded-(--radius-md) border border-line bg-bg p-4">
			<div className="flex items-center gap-2">
				<Icon size={14} className="text-muted" />
				<span className="text-xs text-muted">{label}</span>
			</div>
			<p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
		</div>
	);
}
