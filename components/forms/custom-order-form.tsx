"use client";

import { ArrowRight } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ArtStyle, CustomOrderDraft } from "@/lib/types";
import { cn } from "@/lib/utils";
import { buildWhatsAppLink, customOrderMessage } from "@/lib/whatsapp";

/**
 * Custom-order form.
 *
 * Phase 1 has no backend. The form collects fields locally, builds a
 * pre-filled WhatsApp message via lib/whatsapp.ts, and opens wa.me on
 * submit. Phase 2 can add a server action that also stores the lead --
 * the form shape (CustomOrderDraft) stays the same.
 *
 * Keeping inputs minimal: name, style, approx size, timeline, brief.
 * No file upload (Phase 2 admin), no payment (Phase 2 e-commerce).
 */
interface CustomOrderFormProps {
	phoneE164NoPlus: string;
	availableStyles: readonly ArtStyle[];
}

export function CustomOrderForm({ phoneE164NoPlus, availableStyles }: CustomOrderFormProps) {
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function onSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);

		const formData = new FormData(e.currentTarget);
		const briefMessage = (formData.get("brief") as string | null)?.trim() ?? "";
		if (!briefMessage) {
			setError("Tell Megha a bit about what you'd like.");
			return;
		}

		const styleVal = formData.get("style") as string | null;
		const draft: CustomOrderDraft = {
			name: (formData.get("name") as string | null)?.trim() || undefined,
			style: (styleVal as CustomOrderDraft["style"]) || undefined,
			approxSizeCm: (formData.get("size") as string | null)?.trim() || undefined,
			timeline: (formData.get("timeline") as "open" | "rush" | null) ?? undefined,
			briefMessage,
		};

		const url = buildWhatsAppLink({
			phoneE164NoPlus,
			message: customOrderMessage(draft),
		});

		setSubmitting(true);
		window.open(url, "_blank", "noopener,noreferrer");
		// keep submitting state briefly so the button reads "Opening WhatsApp..."
		setTimeout(() => setSubmitting(false), 1500);
	}

	return (
		<form onSubmit={onSubmit} className="space-y-6" noValidate>
			<Field id="name" label="Your name" optional>
				<input
					id="name"
					name="name"
					type="text"
					autoComplete="name"
					placeholder="What should Megha call you?"
					className={inputClass}
				/>
			</Field>

			<Field id="style" label="Preferred style" optional>
				<select id="style" name="style" defaultValue="" className={inputClass}>
					<option value="">Open to suggestion</option>
					{availableStyles.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
			</Field>

			<div className="grid gap-6 sm:grid-cols-2">
				<Field id="size" label="Approx size" optional>
					<input
						id="size"
						name="size"
						type="text"
						placeholder="e.g. A3, 18 x 24 in, 50 x 70 cm"
						className={inputClass}
					/>
				</Field>

				<Field id="timeline" label="Timeline" optional>
					<select id="timeline" name="timeline" defaultValue="open" className={inputClass}>
						<option value="open">Open -- no rush</option>
						<option value="rush">Rush -- needed soon</option>
					</select>
				</Field>
			</div>

			<Field id="brief" label="Brief" required>
				<textarea
					id="brief"
					name="brief"
					rows={5}
					required
					placeholder="What should the piece show? Any colors, references, occasion?"
					className={cn(inputClass, "resize-y")}
				/>
			</Field>

			{error ? (
				<p role="alert" className="text-sm text-red-700 dark:text-red-400">
					{error}
				</p>
			) : null}

			<div className="flex flex-wrap items-center gap-4">
				<Button type="submit" variant="primary" size="lg" disabled={submitting}>
					{submitting ? "Opening WhatsApp..." : "Send via WhatsApp"}
					<ArrowRight size={16} aria-hidden="true" />
				</Button>
				<p className="text-xs text-muted">
					You&rsquo;ll review the message in WhatsApp before it sends.
				</p>
			</div>
		</form>
	);
}

/* ----------------------------- helpers ----------------------------- */

const inputClass =
	"block w-full min-h-[48px] rounded-md border border-line bg-bg px-4 py-3 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

function Field({
	id,
	label,
	optional,
	required,
	children,
}: {
	id: string;
	label: string;
	optional?: boolean;
	required?: boolean;
	children: React.ReactNode;
}) {
	return (
		<div>
			<label
				htmlFor={id}
				className="flex items-baseline justify-between text-sm font-medium text-ink"
			>
				<span>{label}</span>
				{required ? (
					<span className="text-xs text-muted">required</span>
				) : optional ? (
					<span className="text-xs text-muted">optional</span>
				) : null}
			</label>
			<div className="mt-2">{children}</div>
		</div>
	);
}
