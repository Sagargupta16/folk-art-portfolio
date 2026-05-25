import { Brush, Clock, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { BrushStroke } from "@/components/decor/brush-stroke";
import { InkSplash } from "@/components/decor/ink-splash";
import { MotifEyebrow } from "@/components/decor/motif-eyebrow";
import { PigmentWash } from "@/components/decor/pigment-wash";
import { CustomOrderForm } from "@/components/forms/custom-order-form";
import { Reveal } from "@/components/motion/reveal";
import { getSite } from "@/lib/data";
import { extractPhoneFromWaUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
	title: "Custom orders",
	description:
		"Order a custom painting in any of the styles: Madhubani, Pichwai, Lippan, Gond, Texture, or Mixed Media. Send a brief and we'll get back to you on WhatsApp with a quote and timeline.",
};

interface CustomOrdersSection {
	eyebrow?: string;
	title?: string;
	lead?: string;
	sizes?: readonly string[];
	budgets?: readonly string[];
	timelines?: readonly string[];
	submitLabel?: string;
	fallbackEmailLabel?: string;
}

/**
 * /custom-orders
 *
 * Single column on mobile, 5 / 7 split on desktop. Left rail explains how
 * the process works (3 short steps); right column is the form. On submit
 * the form opens wa.me/<phone>?text=<encoded-brief> in a new tab; an
 * email fallback link appears once the form has been submitted at least
 * once for users whose device blocks WhatsApp deep-links.
 *
 * Section accent: vermillion (matches v1).
 */
export default function CustomOrdersPage() {
	const { contact, sections, styles } = getSite();
	const co = (sections.customOrders ?? {}) as CustomOrdersSection;
	const phone = extractPhoneFromWaUrl(contact.whatsapp.url);
	const sectionStyle = {
		"--section-accent": "var(--color-vermillion)",
	} as CSSProperties;

	return (
		<main
			style={sectionStyle}
			className="relative mx-auto max-w-6xl px-(--container-px) py-(--section-py)"
		>
			<PigmentWash />
			{/*
			 * /custom-orders splash geometry is tighter than the other subpages
			 * because the right column carries the form -- we keep the painterly
			 * register on the left rail (rich vermillion + marigold bleed) but
			 * narrow the primary plume so it doesn't bleed across the form
			 * inputs at sm:+ widths. The subtle counter on the right also
			 * stays small. Trade-off: less visual weight than /work or /contact,
			 * but legibility on the densest interactive surface wins.
			 */}
			<InkSplash
				density="rich"
				tone2="var(--color-marigold)"
				className="left-[-25%] top-[-15%] h-[120%] w-[90%] sm:left-[-12%] sm:w-[52%]"
			/>
			<InkSplash
				align="right"
				density="subtle"
				tone="var(--color-ruby)"
				className="right-[-20%] top-[40%] h-[60%] w-[60%] sm:w-[40%]"
			/>
			<header className="relative max-w-2xl">
				<Reveal>
					<MotifEyebrow motif="mirror-diamond" label={co.eyebrow ?? "Custom orders"} />
				</Reveal>
				<Reveal delayMs={80} as="h1" className="t-display mt-3 text-4xl sm:text-5xl">
					{co.title ?? "Order a custom painting"}
				</Reveal>
				<BrushStroke className="mt-5" width={240} />
				<Reveal delayMs={160}>
					<p className="t-lead mt-4">
						{co.lead ??
							"Tell us what you have in mind. We'll review and get back to you on WhatsApp. No payment until we've talked."}
					</p>
				</Reveal>
			</header>

			<div className="mt-12 grid gap-12 md:grid-cols-12 md:gap-14">
				{/* How it works */}
				<aside className="md:col-span-5">
					<Reveal>
						<p className="t-eyebrow">How it works</p>
					</Reveal>
					<ol className="mt-6 space-y-6">
						<Reveal as="li" delayMs={60}>
							<Step
								icon={Brush}
								title="Send a brief"
								body="Style, size, occasion, anything you'd like reflected. References welcome on WhatsApp once we connect."
							/>
						</Reveal>
						<Reveal as="li" delayMs={120}>
							<Step
								icon={MessageCircle}
								title="We talk it through"
								body="We get back to you on WhatsApp, ask for any missing details, and share a quote + timeline."
							/>
						</Reveal>
						<Reveal as="li" delayMs={180}>
							<Step
								icon={Clock}
								title="The piece is painted, you approve"
								body="Progress shots along the way. Final piece ships from India after your sign-off."
							/>
						</Reveal>
					</ol>
				</aside>

				{/* Form */}
				<section aria-label="Custom order form" className="md:col-span-7">
					<Reveal delayMs={120}>
						{/*
						 * `relative z-10` lifts the form above the InkSplash decor so
						 * the painterly wash never tints input field backgrounds.
						 * `bg-bg` (not `bg-bg-soft`) gives a fully-opaque cream ground
						 * that defends the panel against the splash beneath.
						 */}
						<div className="relative z-10 rounded-md border border-line bg-bg p-6 sm:p-8">
							<CustomOrderForm
								phoneE164NoPlus={phone}
								emailUrl={contact.email.url}
								availableStyles={styles}
								sizes={co.sizes ?? []}
								budgets={co.budgets ?? []}
								timelines={co.timelines ?? []}
								submitLabel={co.submitLabel ?? "Send via WhatsApp"}
								fallbackEmailLabel={co.fallbackEmailLabel ?? "Or email instead"}
							/>
						</div>
					</Reveal>
				</section>
			</div>
		</main>
	);
}

function Step({ icon: Icon, title, body }: { icon: typeof Brush; title: string; body: string }) {
	return (
		<div className="flex gap-4">
			<span
				className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-bg-soft text-(--section-accent) ring-1 ring-line"
				aria-hidden="true"
			>
				<Icon size={16} />
			</span>
			<div>
				<h3 className="t-display text-xl">{title}</h3>
				<p className="mt-1 text-sm text-muted">{body}</p>
			</div>
		</div>
	);
}
