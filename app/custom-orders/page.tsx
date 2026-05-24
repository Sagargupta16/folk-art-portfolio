import { Brush, Clock, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import { CustomOrderForm } from "@/components/forms/custom-order-form";
import { Reveal } from "@/components/motion/reveal";
import { getSite } from "@/lib/data";
import { extractPhoneFromWaUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
	title: "Custom orders",
	description:
		"Order a custom painting from Megha Seth -- Madhubani, Pichwai, Lippan, Gond, Texture, Mixed Media. Submission opens WhatsApp with a pre-filled brief.",
};

/**
 * /custom-orders
 *
 * Single column on mobile, 5 / 7 split on desktop. Left rail explains how
 * the process works (3 short steps); right column is the form. On submit
 * the form opens wa.me/<phone>?text=<encoded-brief> in a new tab.
 */
export default function CustomOrdersPage() {
	const { contact, sections, styles } = getSite();
	const co = sections.customOrders ?? sections["custom-orders"] ?? sections.commission;
	const phone = extractPhoneFromWaUrl(contact.whatsapp.url);

	return (
		<main className="mx-auto max-w-6xl px-(--container-px) py-(--section-py)">
			<header className="max-w-2xl">
				<Reveal>
					<p className="t-eyebrow">{(co as { eyebrow?: string })?.eyebrow ?? "Custom orders"}</p>
				</Reveal>
				<Reveal delayMs={80} as="h1" className="t-display mt-3 text-4xl sm:text-5xl">
					{(co as { title?: string })?.title ?? "Order a custom painting"}
				</Reveal>
				<Reveal delayMs={160}>
					<p className="t-lead mt-4">
						{(co as { lead?: string })?.lead ??
							"Tell me what you have in mind. I'll review and reply on WhatsApp -- no payment until we've talked."}
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
								body="Style, size, occasion, anything you'd like reflected. References welcome over WhatsApp once we connect."
							/>
						</Reveal>
						<Reveal as="li" delayMs={120}>
							<Step
								icon={MessageCircle}
								title="We talk it through"
								body="Megha replies, asks for any missing details, and shares a quote + timeline."
							/>
						</Reveal>
						<Reveal as="li" delayMs={180}>
							<Step
								icon={Clock}
								title="She paints, you approve"
								body="Progress shots along the way. Final piece ships from India after your sign-off."
							/>
						</Reveal>
					</ol>
				</aside>

				{/* Form */}
				<section aria-label="Custom order form" className="md:col-span-7">
					<Reveal delayMs={120}>
						<div className="rounded-lg border border-line bg-bg-soft p-6 sm:p-8">
							<CustomOrderForm phoneE164NoPlus={phone} availableStyles={styles} />
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
				className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-bg-soft text-accent ring-1 ring-line"
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
