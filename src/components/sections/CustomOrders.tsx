import Section from "@/components/layout/Section";
import OrderForm from "@/components/ui/OrderForm";
import { contact, sections, styles } from "@/lib/site";

const c = sections.customOrders;
const whatsappNumber = contact.whatsapp.url.replace(/^https:\/\/wa\.me\//, "");

export default function CustomOrders() {
	return (
		<Section
			id="custom-orders"
			eyebrow={c.eyebrow}
			title={c.title}
			lead={c.lead}
			accent="var(--color-vermillion)"
		>
			<div className="grid gap-10 md:grid-cols-12 md:gap-(--grid-gap)">
				{/* Lead column -- the artisan voice setting up the brief. Sits at
				   editorial reading width on the left. */}
				<div className="stagger md:col-span-5">
					<p className="t-meta reveal" style={{ color: "var(--section-accent)" }}>
						Commissions
					</p>
					<p className="t-body reveal mt-3">
						Each commission is a conversation. Tell me a bit about the piece you have in mind -- the
						style, the size, the room it will live in. I'll write back from WhatsApp with timeline
						and pricing, and we'll refine from there.
					</p>
					<p className="t-body reveal mt-4">
						The form below opens our chat with your brief pre-filled. Nothing is sent or stored
						until you press send in WhatsApp.
					</p>
					<p
						className="reveal mt-6 font-devanagari text-2xl"
						lang="hi"
						aria-hidden="true"
						style={{
							color: "color-mix(in oklch, var(--section-accent) 70%, var(--color-muted))",
						}}
					>
						शुभारम्भ
					</p>
				</div>
				{/* Form panel -- glass-floating so the brief reads as a commissioned
				   piece sitting on the page. */}
				<div className="reveal md:col-span-7">
					<div className="glass-floating p-6 sm:p-8 md:p-10">
						<OrderForm
							styles={styles}
							sizes={c.sizes}
							budgets={c.budgets}
							timelines={c.timelines}
							whatsappNumber={whatsappNumber}
							emailUrl={contact.email.url}
							submitLabel={c.submitLabel}
							fallbackEmailLabel={c.fallbackEmailLabel}
						/>
					</div>
				</div>
			</div>
		</Section>
	);
}
