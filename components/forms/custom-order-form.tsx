"use client";

import { ArrowRight, Check, ChevronDown, Mail } from "lucide-react";
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
	const [sent, setSent] = useState(false);

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
		} else {
			setSent(true);
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

			<SelectField id="style" label="Preferred style">
				<select id="style" name="style" defaultValue="" className={selectClass}>
					<option value="">Open to suggestion</option>
					{availableStyles.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
			</SelectField>

			<div className="grid gap-6 sm:grid-cols-2">
				<SelectField id="size" label="Approx size">
					<select id="size" name="size" defaultValue="" className={selectClass}>
						<option value="">No preference</option>
						{sizes.map((s) => (
							<option key={s} value={s}>
								{s}
							</option>
						))}
					</select>
				</SelectField>

				<SelectField id="budget" label="Budget">
					<select id="budget" name="budget" defaultValue="" className={selectClass}>
						<option value="">Open / not sure</option>
						{budgets.map((b) => (
							<option key={b} value={b}>
								{b}
							</option>
						))}
					</select>
				</SelectField>
			</div>

			<SelectField id="timeline" label="Timeline">
				<select id="timeline" name="timeline" defaultValue="" className={selectClass}>
					<option value="">No specific timeline</option>
					{timelines.map((t) => (
						<option key={t} value={t}>
							{t}
						</option>
					))}
				</select>
			</SelectField>

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
				{sent && !error ? (
					<div className="flex items-start gap-3 rounded-md border border-(--section-accent)/40 bg-(--section-accent)/5 p-4">
						<span
							className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-(--section-accent) text-bg"
							aria-hidden="true"
						>
							<Check size={14} />
						</span>
						<div>
							<p className="text-sm font-medium text-ink">Your brief is ready in WhatsApp.</p>
							<p className="mt-1 text-xs text-muted">
								Review and send it there to reach us. Didn&rsquo;t open? Use the email link below.
							</p>
						</div>
					</div>
				) : null}
			</div>

			<div className="flex flex-col items-start gap-3">
				<Button type="submit" variant="primary" size="lg" disabled={submitting}>
					{submitting ? "Opening WhatsApp..." : sent ? "Reopen in WhatsApp" : submitLabel}
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
	"block w-full min-h-12 rounded-md border border-line bg-bg px-4 py-3 text-base text-ink placeholder:text-muted transition-[border-color,box-shadow] duration-(--duration-fast) focus:border-(--section-accent) focus:outline-none focus:ring-2 focus:ring-(--section-accent)/30";

// Selects drop the OS chevron (appearance-none) so they match the cream/ink
// fields; a lucide chevron is layered in via the SelectField wrapper. Extra
// right padding leaves room for it.
const selectClass = cn(inputClass, "appearance-none pr-11 cursor-pointer");

function SelectField({
	id,
	label,
	children,
}: {
	id: string;
	label: string;
	children: React.ReactNode;
}) {
	return (
		<Field id={id} label={label} optional>
			<div className="relative">
				{children}
				<ChevronDown
					size={16}
					aria-hidden="true"
					className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
				/>
			</div>
		</Field>
	);
}

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
