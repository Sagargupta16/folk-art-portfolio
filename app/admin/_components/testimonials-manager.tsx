"use client";

import { Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Testimonial } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
	createTestimonial,
	deleteTestimonial,
	setTestimonialFeatured,
} from "../testimonial-actions";
import { useConfirm } from "./confirm-dialog";
import {
	adminBtn,
	adminBtnPrimary,
	adminField,
	adminIconBtnDestructive,
	adminLabel,
} from "./controls";
import { useAdminAction } from "./use-admin-action";
import { useServerSyncedList } from "./use-server-synced-list";

/**
 * Admin CRUD for testimonials: a create form, then a list where each row can be
 * featured (shown on home) or deleted. Mirrors the workshop/preset managers.
 */
export function TestimonialsManager({
	testimonials: initial,
	artworkSlugs,
}: Readonly<{ testimonials: Testimonial[]; artworkSlugs: string[] }>) {
	const confirm = useConfirm();
	const { pending, err, run } = useAdminAction();
	const [items, setItems] = useServerSyncedList(initial);

	const onFeature = (id: string, featured: boolean) => {
		run(
			() => setTestimonialFeatured(id, featured),
			() => setItems((prev) => prev.map((t) => (t.id === id ? { ...t, featured } : t))),
		);
	};

	const onDelete = async (id: string) => {
		const ok = await confirm({
			title: "Delete this testimonial?",
			body: "This removes it from the site permanently.",
			confirmLabel: "Delete",
			destructive: true,
		});
		if (!ok) return;
		run(
			() => deleteTestimonial(id),
			() => setItems((prev) => prev.filter((t) => t.id !== id)),
		);
	};

	return (
		<div className="space-y-6">
			<CreateForm
				pending={pending}
				artworkSlugs={artworkSlugs}
				onCreate={(fd, reset) => run(() => createTestimonial(fd), reset)}
			/>

			{err ? (
				<p role="alert" className="text-sm text-ruby">
					{err}
				</p>
			) : null}

			{items.length === 0 ? (
				<p className="rounded-(--radius-sm) border border-dashed border-line p-6 text-center text-sm text-muted">
					No testimonials yet. Add one above; featured ones show on the home page.
				</p>
			) : (
				<ul className="space-y-2">
					{items.map((t) => (
						<li key={t.id} className="rounded-(--radius-sm) border border-line bg-bg p-4">
							<blockquote className="text-sm text-ink">&ldquo;{t.quote}&rdquo;</blockquote>
							<div className="mt-2 flex flex-wrap items-center justify-between gap-2">
								<p className="text-xs text-muted">
									{t.authorName}
									{t.authorLocation ? `, ${t.authorLocation}` : ""}
									{t.artworkSlug ? ` · on ${t.artworkSlug}` : ""}
								</p>
								<div className="flex items-center gap-2">
									<button
										type="button"
										disabled={pending}
										onClick={() => onFeature(t.id, !t.featured)}
										aria-pressed={t.featured}
										className={cn(
											adminBtn,
											"px-2.5 py-1.5",
											t.featured && "border-accent text-accent",
										)}
									>
										<Star size={13} className={t.featured ? "fill-accent" : undefined} />
										{t.featured ? "Featured" : "Feature"}
									</button>
									<button
										type="button"
										disabled={pending}
										onClick={() => onDelete(t.id)}
										aria-label="Delete testimonial"
										className={adminIconBtnDestructive}
									>
										<Trash2 size={15} />
									</button>
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

function CreateForm({
	pending,
	artworkSlugs,
	onCreate,
}: Readonly<{
	pending: boolean;
	artworkSlugs: string[];
	onCreate: (fd: FormData, reset: () => void) => void;
}>) {
	const [open, setOpen] = useState(false);

	if (!open) {
		return (
			<button type="button" onClick={() => setOpen(true)} className={adminBtn}>
				<Plus size={15} /> Add testimonial
			</button>
		);
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				const form = e.currentTarget;
				onCreate(new FormData(form), () => {
					form.reset();
					setOpen(false);
				});
			}}
			className="space-y-3 rounded-(--radius-md) border border-line bg-bg-soft p-4"
		>
			<div className={adminLabel}>
				<label htmlFor="new-testimonial-quote">Quote *</label>
				<textarea
					id="new-testimonial-quote"
					name="quote"
					required
					rows={3}
					placeholder="What they said"
					className={cn(adminField, "w-full resize-y")}
				/>
			</div>
			<div className="grid gap-3 sm:grid-cols-2">
				<div className={adminLabel}>
					<label htmlFor="new-testimonial-author">Author name *</label>
					<input
						id="new-testimonial-author"
						name="authorName"
						required
						placeholder="e.g. Priya"
						className={adminField}
					/>
				</div>
				<div className={adminLabel}>
					<label htmlFor="new-testimonial-location">Location</label>
					<input
						id="new-testimonial-location"
						name="authorLocation"
						placeholder="e.g. Pune"
						className={adminField}
					/>
				</div>
			</div>
			<label className="block text-xs font-medium text-muted" htmlFor="artworkSlug">
				Link to an artwork (optional)
			</label>
			<select
				id="artworkSlug"
				name="artworkSlug"
				defaultValue=""
				className={cn(adminField, "w-full")}
			>
				<option value="">None</option>
				{artworkSlugs.map((s) => (
					<option key={s} value={s}>
						{s}
					</option>
				))}
			</select>
			<label className="flex min-h-11 items-center gap-2 text-sm text-ink">
				<input type="checkbox" name="featured" /> Feature on home page
			</label>
			<div className="flex items-center gap-2">
				<button type="submit" disabled={pending} className={adminBtnPrimary}>
					{pending ? "Adding..." : "Add"}
				</button>
				<button
					type="button"
					disabled={pending}
					onClick={() => setOpen(false)}
					className={adminBtn}
				>
					Cancel
				</button>
			</div>
		</form>
	);
}
