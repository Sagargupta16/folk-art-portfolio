import { ArrowRight, BookOpen } from "lucide-react";
import { Suspense } from "react";
import { WorkFilter } from "@/components/gallery/work-filter";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { getAllArtworks, getCategoryNames, getSite } from "@/lib/data";
import { createPageMetadata } from "@/lib/page-metadata";
import { cn } from "@/lib/utils";

export const metadata = createPageMetadata({
	title: "Artwork",
	description:
		"Selected paintings across Madhubani, Pichwai, Lippan, Gond, Texture, and Mixed Media.",
	path: "/work/",
});

export default async function WorkPage() {
	const [all, styles] = await Promise.all([getAllArtworks(), getCategoryNames()]);
	const { sections, contact } = getSite();
	const work = sections.work;

	return (
		<main>
			<Section accent="ruby" background="soft" borderBottom>
				<Container className="py-(--section-py)">
					<PageHeader
						eyebrow={work?.eyebrow ?? "Work"}
						title={work?.title ?? "Selected work"}
						lead={work?.lead}
					>
						<Reveal delayMs={200}>
							<p className="t-meta mt-5">
								{all.length} {all.length === 1 ? "piece" : "pieces"}
							</p>
						</Reveal>
						{contact.whatsapp.catalog ? (
							<Reveal delayMs={260}>
								<a
									href={contact.whatsapp.catalog}
									target="_blank"
									rel="noopener noreferrer"
									className={cn(buttonVariants({ variant: "secondary" }), "group mt-6")}
								>
									<BookOpen size={16} aria-hidden="true" />
									Shop on WhatsApp
									<ArrowRight
										size={14}
										aria-hidden="true"
										className="transition-transform duration-(--duration-base) ease-(--ease-out) group-hover:translate-x-1"
									/>
								</a>
							</Reveal>
						) : null}
					</PageHeader>
				</Container>
			</Section>

			<Section accent="ruby">
				<Container className="py-(--section-py)">
					{/* Suspense boundary: WorkFilter reads useSearchParams (the ?style=
					    / ?view= lens), which Next requires be wrapped on a static route. */}
					<Suspense>
						<WorkFilter styles={styles} items={all} />
					</Suspense>
				</Container>
			</Section>
		</main>
	);
}
