import { requireAdminPage } from "@/lib/admin-auth";
import { getAllArtworkSlugs, getAllTestimonials } from "@/lib/data";
import { AdminPageHeader } from "../_components/admin-page-header";
import { TestimonialsManager } from "../_components/testimonials-manager";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
	await requireAdminPage();
	const [testimonials, slugs] = await Promise.all([getAllTestimonials(), getAllArtworkSlugs()]);

	return (
		<div className="max-w-3xl space-y-6">
			<AdminPageHeader
				title="Testimonials"
				description="Words from buyers and workshop guests. A testimonial only appears in public once you place it:"
			>
				<ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
					<li>
						<span className="font-medium text-ink">Feature</span> it to show it in the &ldquo;In
						their words&rdquo; row on the <span className="font-medium text-ink">home page</span>.
					</li>
					<li>
						<span className="font-medium text-ink">Link an artwork</span> to also show it on that
						piece&rsquo;s detail page.
					</li>
					<li>Leave both unset and it stays here in admin only, not shown anywhere public.</li>
				</ul>
			</AdminPageHeader>
			<TestimonialsManager testimonials={[...testimonials]} artworkSlugs={[...slugs]} />
		</div>
	);
}
