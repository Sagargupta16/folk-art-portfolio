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
			align="center"
			accent="var(--color-vermillion)"
		>
			<div className="reveal mx-auto max-w-2xl">
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
		</Section>
	);
}
