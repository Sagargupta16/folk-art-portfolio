import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Custom orders",
};

export default function CustomOrdersPage() {
	return (
		<main className="mx-auto max-w-2xl px-6 py-16">
			<p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Custom orders</p>
			<h1 className="mt-3 font-display text-4xl italic">Order a custom painting</h1>
			<p className="mt-4 text-[var(--color-muted)]">
				Form lands next. Submission will route to WhatsApp via a pre-filled message.
			</p>
		</main>
	);
}
