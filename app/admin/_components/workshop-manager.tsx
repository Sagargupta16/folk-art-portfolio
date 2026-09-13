"use client";

import { Check, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { Workshop } from "@/lib/types";
import { cn } from "@/lib/utils";
import { createWorkshop, deleteWorkshop, reorderWorkshops, updateWorkshop } from "../actions";
import { useConfirm } from "./confirm-dialog";
import {
	adminBtn,
	adminBtnPrimary,
	adminField,
	adminIconBtnDestructive,
	adminLabel,
} from "./controls";
import { ReorderBar } from "./reorder-bar";
import { ReorderHandle } from "./reorder-handle";
import { SAVED_BADGE_DURATION_MS, useAdminAction } from "./use-admin-action";
import { useReorder } from "./use-reorder";
import { useServerSyncedList } from "./use-server-synced-list";

export function WorkshopManager({ workshops: initial }: Readonly<{ workshops: Workshop[] }>) {
	const confirm = useConfirm();
	const { pending, err, run } = useAdminAction();
	const [baseline, setBaseline] = useState(initial);
	// Adopt fresh server data after a create (router.refresh), resetting the
	// reorder baseline to match so a new row doesn't read as an unsaved move.
	const [items, setItems] = useServerSyncedList(initial, setBaseline);
	const [saved, setSaved] = useState(false);
	const { dragging, over, dragProps, move } = useReorder(items, setItems, pending);

	const handleSaveOrder = () => {
		setSaved(false);
		return run(
			() => reorderWorkshops(items.map((i) => i.slug)),
			() => {
				setBaseline(items);
				setSaved(true);
				setTimeout(() => setSaved(false), SAVED_BADGE_DURATION_MS);
			},
		);
	};

	const handleDelete = (slug: string) => {
		run(
			() => deleteWorkshop(slug),
			() => {
				setItems((prev) => prev.filter((i) => i.slug !== slug));
				setBaseline((prev) => prev.filter((i) => i.slug !== slug));
			},
		);
	};

	const hasOrderChanges = items.some((item, i) => item.slug !== baseline[i]?.slug);

	return (
		<div className="space-y-6">
			{/* Create form */}
			<CreateWorkshopForm
				pending={pending}
				onCreate={(fd, reset) => run(() => createWorkshop(fd), reset)}
			/>

			{err ? (
				<p role="alert" className="text-sm text-ruby">
					{err}
				</p>
			) : null}

			{/* List */}
			<ul className="space-y-2">
				{items.map((w, i) => (
					<li
						key={w.slug}
						{...dragProps(i)}
						className={cn(
							"rounded-(--radius-sm) border border-line bg-bg transition-all duration-(--duration-fast)",
							dragging === i && "opacity-50",
							over === i && dragging !== i && "border-accent shadow-e1",
						)}
					>
						<WorkshopItem
							workshop={w}
							pending={pending}
							reorderHandle={
								<ReorderHandle
									label={w.title}
									index={i}
									count={items.length}
									disabled={pending}
									onMove={(to) => move(i, to)}
								/>
							}
							onSave={(fields) => run(() => updateWorkshop(w.slug, fields))}
							onDelete={async () => {
								const ok = await confirm({
									title: `Delete "${w.title}"?`,
									body: "This removes the workshop from the public site.",
									confirmLabel: "Delete",
								});
								if (ok) handleDelete(w.slug);
							}}
						/>
					</li>
				))}
				{items.length === 0 ? (
					<li className="rounded-(--radius-sm) border border-dashed border-line p-6 text-center text-sm text-muted">
						No workshops yet. Add one above.
					</li>
				) : null}
			</ul>

			{hasOrderChanges ? (
				<ReorderBar
					label="Workshop order changed"
					pending={pending}
					saved={saved}
					onSave={handleSaveOrder}
					onReset={() => setItems(baseline)}
				/>
			) : null}
		</div>
	);
}

function CreateWorkshopForm({
	pending,
	onCreate,
}: Readonly<{ pending: boolean; onCreate: (fd: FormData, reset: () => void) => void }>) {
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				const form = e.currentTarget;
				onCreate(new FormData(form), () => form.reset());
			}}
			className="rounded-(--radius-md) border border-line bg-bg-soft p-4"
		>
			<p className="mb-3 text-xs font-medium text-muted">Add a workshop</p>
			<div className="grid gap-3 sm:grid-cols-2">
				<div className={adminLabel}>
					<label htmlFor="new-workshop-title">Title *</label>
					<input
						id="new-workshop-title"
						name="title"
						placeholder="e.g. Gond painting"
						required
						className={adminField}
					/>
				</div>
				<div className={adminLabel}>
					<label htmlFor="new-workshop-duration">Duration (hours)</label>
					<input
						id="new-workshop-duration"
						name="durationHours"
						type="number"
						step="0.5"
						min="0"
						placeholder="e.g. 2"
						className={adminField}
					/>
				</div>
				<div className={`${adminLabel} sm:col-span-2`}>
					<label htmlFor="new-workshop-blurb">Description *</label>
					<textarea
						id="new-workshop-blurb"
						name="blurb"
						placeholder="What participants will make and learn"
						rows={3}
						required
						className={adminField}
					/>
				</div>
			</div>
			<button type="submit" disabled={pending} className={`${adminBtnPrimary} mt-4 w-full`}>
				<Plus size={14} aria-hidden="true" />
				Add workshop
			</button>
		</form>
	);
}

function WorkshopItem({
	workshop,
	pending,
	reorderHandle,
	onSave,
	onDelete,
}: Readonly<{
	workshop: Workshop;
	pending: boolean;
	reorderHandle: React.ReactNode;
	onSave: (fields: {
		title: string;
		blurb: string;
		durationHours: number | null;
	}) => Promise<boolean>;
	onDelete: () => void;
}>) {
	const [editing, setEditing] = useState(false);
	const [title, setTitle] = useState(workshop.title);
	const [blurb, setBlurb] = useState(workshop.blurb);
	const [duration, setDuration] = useState(workshop.durationHours?.toString() ?? "");

	if (!editing) {
		return (
			<div className="flex items-center gap-3 p-3">
				{reorderHandle}
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium">{workshop.title}</p>
					<p className="truncate text-xs text-muted">{workshop.blurb}</p>
				</div>
				{workshop.durationHours ? (
					<span className="t-meta shrink-0 text-[0.65rem]">{workshop.durationHours}h</span>
				) : null}
				<button
					type="button"
					disabled={pending}
					onClick={() => {
						setTitle(workshop.title);
						setBlurb(workshop.blurb);
						setDuration(workshop.durationHours?.toString() ?? "");
						setEditing(true);
					}}
					className={`${adminBtn} min-w-11 px-2 py-1`}
				>
					Edit
				</button>
				<button
					type="button"
					disabled={pending}
					onClick={onDelete}
					aria-label={`Delete ${workshop.title}`}
					className={adminIconBtnDestructive}
				>
					<Trash2 size={14} aria-hidden="true" />
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-2 p-3">
			<div className={adminLabel}>
				<label htmlFor={`workshop-title-${workshop.slug}`}>Title</label>
				<input
					disabled={pending}
					id={`workshop-title-${workshop.slug}`}
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className={`${adminField} w-full`}
				/>
			</div>
			<div className={adminLabel}>
				<label htmlFor={`workshop-blurb-${workshop.slug}`}>Description</label>
				<textarea
					disabled={pending}
					id={`workshop-blurb-${workshop.slug}`}
					value={blurb}
					onChange={(e) => setBlurb(e.target.value)}
					rows={3}
					className={`${adminField} w-full`}
				/>
			</div>
			<div className="flex items-center gap-2">
				<div className={`${adminLabel} mr-auto`}>
					<label htmlFor={`workshop-duration-${workshop.slug}`}>Hours</label>
					<input
						disabled={pending}
						id={`workshop-duration-${workshop.slug}`}
						value={duration}
						onChange={(e) => setDuration(e.target.value)}
						type="number"
						step="0.5"
						min="0"
						className={`${adminField} w-24`}
					/>
				</div>
				<button
					type="button"
					disabled={pending}
					onClick={async () => {
						const parsedDuration = duration ? Number(duration) : null;
						const saved = await onSave({
							title: title.trim(),
							blurb: blurb.trim(),
							durationHours:
								parsedDuration && !Number.isNaN(parsedDuration) ? parsedDuration : null,
						});
						if (saved) setEditing(false);
					}}
					className={`${adminBtnPrimary} px-3 py-1.5`}
				>
					<Check size={14} aria-hidden="true" />
					Save
				</button>
				<button
					type="button"
					disabled={pending}
					onClick={() => {
						setTitle(workshop.title);
						setBlurb(workshop.blurb);
						setDuration(workshop.durationHours?.toString() ?? "");
						setEditing(false);
					}}
					className={`${adminBtn} px-3 py-1.5`}
				>
					<X size={14} aria-hidden="true" />
					Cancel
				</button>
			</div>
		</div>
	);
}
