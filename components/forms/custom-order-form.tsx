"use client";

import { ArrowRight, Mail } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ArtStyle, CustomOrderDraft } from "@/lib/types";
import { cn } from "@/lib/utils";
import { buildWhatsAppLink, customOrderMailto, customOrderMessage } from "@/lib/whatsapp";

/**
 * Custom-order form.
 *
 * Phase 1 has no backend. The form collects fields locally, builds a
 * pre-filled WhatsApp message (or mailto fallback) via lib/whatsapp.ts,
 * and opens the chosen channel on submit. Phase 2 can add a server
 * action that also stores the lead -- the form shape (CustomOrderDraft)
 * stays the same.
 *
 * Preset dropdowns (sizes, budgets, timelines) are driven by the
 * `data/site.json` customOrders arrays so the artist can edit options
 * without touching code.
 */
interface CustomOrderFormProps {
	phoneE164NoPlus: string;
	emailUrl: string;
	availableStyles: readonly ArtStyle[];
	sizes: readonly string[];
	budgets: readonly string[];
	timelines: readonly string[];
	submitLabel: string;
	fallbackEmailLabel: string;
}

export function CustomOrderForm({
	phoneE164NoPlus,
	emailUrl,
	availableStyles,
	sizes,
	budgets,
	timelines,
	submitLabel,
	fallbackEmailLabel,
}: CustomOrderFormProps) {
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [draft, setDraft] = useState<CustomOrderDraft | null>(null);

	function readDraft(form: HTMLFormElement): CustomOrderDraft | null {
		const formData = new FormData(form);
		const briefMessage = (formData.get("brief") as string | null)?.trim() ?? "";
		if (!briefMessage) {
			setError("Tell us a bit about what you'd like.");
			return null;
		}
		const styleVal = formData.get("style") as string | null;
		return {
			name: (formData.get("name") as string | null)?.trim() || undefined,
			style: (styleVal as CustomOrderDraft["style"]) || undefined,
			size: (formData.get("size") as string | null) || undefined,
			budget: (formData.get("budget") as string | null) || undefined,
			timeline: (formData.get("timeline") as string | null) || undefined,
			briefMessage,
		};
	}

	function onSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		const next = readDraft(e.currentTarget);
		if (!next) return;
		setDraft(next);
		const url = buildWhatsAppLink({ phoneE164NoPlus, message: customOrderMessage(next) });
		setSubmitting(true);
		// `window.open` returns null when blocked (popup blocker, in-app
		// browser like Instagram). Surface the email fallback explicitly so
		// the user has a recovery path; the mailto link below also renders.
		const opened = window.open(url, "_blank", "noopener,noreferrer");
		if (!opened) {
			setError("Couldn't open WhatsApp. Use the email link below to send your brief instead.");
		}
		setTimeout(() => setSubmitting(false), 1500);
	}

	const mailtoHref = draft ? customOrderMailto(emailUrl, draft) : null;

	return (
		<form onSubmit={onSubmit} className="space-y-6" noValidate>
			<Field id="name" label="Your name" optional>
				<input
					id="name"
					name="name"
					type="text"
					autoComplete="name"
					placeholder="What should we call you?"
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
					<select id="size" name="size" defaultValue="" className={inputClass}>
						<option value="">No preference</option>
						{sizes.map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
				</Field>

				<Field id="budget" label="Budget" optional>
					<select id="budget" name="budget" defaultValue="" className={inputClass}>
						<option value="">Open / not sure</option>
						{budgets.map((b) => (
							<option key={b} value={b}>
								{b}
							</option>
						))}
					</select>
				</Field>
			</div>

			<Field id="timeline" label="Timeline" optional>
				<select id="timeline" name="timeline" defaultValue="" className={inputClass}>
					<option value="">No specific timeline</option>
					{timelines.map((t) => (
						<option key={t} value={t}>
							{t}
						</option>
					))}
				</select>
			</Field>

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

			<div aria-live="polite" aria-atomic="true">
				{error ? <p className="text-sm text-red-700 dark:text-red-400">{error}</p> : null}
			</div>

			<div className="flex flex-col items-start gap-3">
				<Button type="submit" variant="primary" size="lg" disabled={submitting}>
					{submitting ? "Opening WhatsApp..." : submitLabel}
					<ArrowRight size={16} aria-hidden="true" />
				</Button>
				<p className="text-xs text-muted">
					You&rsquo;ll review the message in WhatsApp before it sends.
				</p>
				{mailtoHref ? (
					<a
						href={mailtoHref}
						className="inline-flex items-center gap-2 text-sm text-(--section-accent) underline-offset-4 hover:underline"
					>
						<Mail size={14} aria-hidden="true" /> {fallbackEmailLabel}
					</a>
				) : null}
			</div>
		</form>
	);
}

/* ----------------------------- helpers ----------------------------- */

const inputClass =
	"block w-full min-h-12 rounded-md border border-line bg-bg px-4 py-3 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

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
