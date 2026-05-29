import { ArrowRight, Brush, Clock, MessageCircle } from "lucide-react";
import Link from "next/link";
import { BrushStroke } from "@/components/decor/brush-stroke";
import { InkSplash } from "@/components/decor/ink-splash";
import { MotifEyebrow } from "@/components/decor/motif-eyebrow";
import { PigmentWash } from "@/components/decor/pigment-wash";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/whatsapp";

/** Home "05 Custom orders" teaser. Vermillion accent, 3-step strip + CTAs. */
export function CustomOrdersTeaser({
	phone,
	eyebrow,
	title,
	lead,
}: {
	phone: string;
	eyebrow: string;
	title: string;
	lead?: string;
}) {
	const quickWa = buildWhatsAppLink({
		phoneE164NoPlus: phone,
		message: "Hi, I'd like to discuss a custom piece.",
	});
	return (
		<section
			className="relative overflow-hidden border-b border-line bg-bg-soft"
			style={{ "--section-accent": "var(--color-vermillion)" } as React.CSSProperties}
		>
			<PigmentWash />
			<InkSplash
				align="left"
				density="subtle"
				className="left-[-15%] top-[-10%] h-[80%] w-[80%] sm:w-[55%]"
			/>
			<div className="relative mx-auto max-w-6xl px-(--container-px) py-(--section-py)">
				<header className="max-w-2xl">
					<Reveal>
						<MotifEyebrow motif="mirror-diamond" number="05" label={eyebrow} />
					</Reveal>
					<Reveal delayMs={80} as="h2" className="t-display mt-3 text-4xl sm:text-5xl">
						{title}
					</Reveal>
					<BrushStroke className="mt-4" width={220} />
					{lead ? (
						<Reveal delayMs={160}>
							<p className="t-lead mt-4">{lead}</p>
						</Reveal>
					) : null}
				</header>

				<ol className="mt-12 grid gap-6 sm:grid-cols-3 sm:mt-16">
					<Reveal as="li" delayMs={60}>
						<TeaserStep
							icon={Brush}
							title="Send a brief"
							body="Style, size, occasion. References welcome on WhatsApp."
						/>
					</Reveal>
					<Reveal as="li" delayMs={120}>
						<TeaserStep
							icon={MessageCircle}
							title="We talk it through"
							body="Quote and timeline come back over WhatsApp."
						/>
					</Reveal>
					<Reveal as="li" delayMs={180}>
						<TeaserStep
							icon={Clock}
							title="Painted, approved, shipped"
							body="Progress shots along the way. Ships from India after sign-off."
						/>
					</Reveal>
				</ol>

				<Reveal delayMs={260}>
					<div className="mt-12 flex flex-wrap items-center gap-3 sm:mt-14">
						<a
							href={quickWa}
							target="_blank"
							rel="noopener noreferrer"
							className={buttonVariants({ variant: "primary" })}
						>
							Start on WhatsApp
						</a>
						<Link
							href="/custom-orders"
							className="inline-flex items-center gap-2 text-sm uppercase tracking-meta text-(--section-accent) transition-opacity hover:opacity-80"
						>
							Open the brief form <ArrowRight size={14} aria-hidden="true" />
						</Link>
					</div>
				</Reveal>
			</div>
		</section>
	);
}

function TeaserStep({
	icon: Icon,
	title,
	body,
}: {
	icon: typeof Brush;
	title: string;
	body: string;
}) {
	return (
		<div className="flex h-full flex-col rounded-md border border-line bg-bg p-6">
			<span
				className="grid h-10 w-10 place-items-center rounded-full bg-bg-soft text-(--section-accent) ring-1 ring-line"
				aria-hidden="true"
			>
				<Icon size={18} />
			</span>
			<h3 className="t-display mt-4 text-xl">{title}</h3>
			<p className="mt-2 text-sm text-muted">{body}</p>
		</div>
	);
}
