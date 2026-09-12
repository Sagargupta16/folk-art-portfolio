"use client";

import { Check, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { OrderPreset, OrderPresetKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
	createOrderPreset,
	deleteOrderPreset,
	reorderOrderPresets,
	updateOrderPreset,
} from "../actions";
import { useConfirm } from "./confirm-dialog";
import {
	adminBtn,
	adminBtnPrimary,
	adminField,
	adminIconBtn,
	adminIconBtnDestructive,
	adminIconBtnPrimary,
} from "./controls";
import { ReorderHandle } from "./reorder-handle";
import { useAdminAction } from "./use-admin-action";
import { useReorder } from "./use-reorder";
import { useServerSyncedList } from "./use-server-synced-list";

const GROUPS: Array<{ kind: OrderPresetKind; title: string; hint: string }> = [
	{ kind: "size", title: "Sizes", hint: "e.g. A4 (8 x 12 inches)" },
	{ kind: "budget", title: "Budgets", hint: "e.g. Under INR 5,000" },
	{ kind: "timeline", title: "Timelines", hint: "e.g. Within a month" },
];

export function PresetManager({ presets }: Readonly<{ presets: OrderPreset[] }>) {
	return (
		<div className="space-y-8">
			{GROUPS.map((g) => (
				<PresetGroup
					key={g.kind}
					kind={g.kind}
					title={g.title}
					hint={g.hint}
					items={presets.filter((p) => p.kind === g.kind)}
				/>
			))}
		</div>
	);
}

function PresetGroup({
	kind,
	title,
	hint,
	items: initial,
}: Readonly<{
	kind: OrderPresetKind;
	title: string;
	hint: string;
	items: OrderPreset[];
}>) {
	const confirm = useConfirm();
	const { pending, err, run } = useAdminAction();
	const [baseline, setBaseline] = useState(initial);
	// Adopt fresh server data after a create (router.refresh), keeping the
	// reorder baseline in step.
	const [items, setItems] = useServerSyncedList(initial, setBaseline);
	const [newLabel, setNewLabel] = useState("");
	const { dragging, over, dragProps, move } = useReorder(items, setItems, pending);

	const handleDelete = (id: string) => {
		run(
			() => deleteOrderPreset(id),
			() => {
				setItems((prev) => prev.filter((i) => i.id !== id));
				setBaseline((prev) => prev.filter((i) => i.id !== id));
			},
		);
	};

	const hasOrderChanges = items.some((item, i) => item.id !== baseline[i]?.id);

	return (
		<section className="rounded-(--radius-md) border border-line bg-bg p-4 sm:p-5">
			<div className="mb-3 flex items-baseline justify-between gap-3">
				<h3 className="text-sm font-semibold">{title}</h3>
				{hasOrderChanges ? (
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setItems(baseline)}
							disabled={pending}
							className={`${adminBtn} px-2.5 py-1 text-xs`}
						>
							Reset
						</button>
						<button
							type="button"
							onClick={() =>
								run(
									() => reorderOrderPresets(items.map((i) => i.id)),
									() => setBaseline(items),
								)
							}
							disabled={pending}
							className={`${adminBtn} px-2.5 py-1 text-xs border-accent text-accent`}
						>
							Save order
						</button>
					</div>
				) : null}
			</div>

			{/* List */}
			<ul className="space-y-2">
				{items.map((p, i) => (
					<li
						key={p.id}
						{...dragProps(i)}
						className={cn(
							"rounded-(--radius-sm) border border-line bg-bg-soft transition-all duration-(--duration-fast)",
							dragging === i && "opacity-50",
							over === i && dragging !== i && "border-accent shadow-e1",
						)}
					>
						<PresetItem
							preset={p}
							pending={pending}
							reorderHandle={
								<ReorderHandle
									label={p.label}
									index={i}
									count={items.length}
									disabled={pending}
									onMove={(to) => move(i, to)}
								/>
							}
							onSave={(label) => run(() => updateOrderPreset(p.id, label))}
							onDelete={async () => {
								const ok = await confirm({
									title: `Remove "${p.label}"?`,
									body: "This option will no longer appear on the custom-order form.",
									confirmLabel: "Remove",
								});
								if (ok) handleDelete(p.id);
							}}
						/>
					</li>
				))}
				{items.length === 0 ? (
					<li className="rounded-(--radius-sm) border border-dashed border-line p-4 text-center text-xs text-muted">
						No options yet. Add one below.
					</li>
				) : null}
			</ul>

			{/* Add */}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					if (!newLabel.trim()) return;
					run(
						() => createOrderPreset(kind, newLabel),
						() => setNewLabel(""),
					);
				}}
				className="mt-3 flex items-center gap-2"
			>
				<input
					value={newLabel}
					onChange={(e) => setNewLabel(e.target.value)}
					aria-label={`New ${title.toLowerCase()} option`}
					placeholder={hint}
					className={`${adminField} flex-1`}
				/>
				<button type="submit" disabled={pending} className={adminBtnPrimary}>
					<Plus size={14} />
					Add
				</button>
			</form>

			{err ? (
				<p role="alert" className="mt-2 text-xs text-ruby">
					{err}
				</p>
			) : null}
		</section>
	);
}

function PresetItem({
	preset,
	pending,
	reorderHandle,
	onSave,
	onDelete,
}: Readonly<{
	preset: OrderPreset;
	pending: boolean;
	reorderHandle: React.ReactNode;
	onSave: (label: string) => Promise<boolean>;
	onDelete: () => void;
}>) {
	const [editing, setEditing] = useState(false);
	const [label, setLabel] = useState(preset.label);

	if (!editing) {
		return (
			<div className="flex items-center gap-3 p-2.5">
				{reorderHandle}
				<span className="flex-1 truncate text-sm">{preset.label}</span>
				<button
					type="button"
					disabled={pending}
					onClick={() => {
						setLabel(preset.label);
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
					aria-label={`Delete ${preset.label}`}
					className={adminIconBtnDestructive}
				>
					<Trash2 size={14} aria-hidden="true" />
				</button>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2 p-2.5">
			<input
				disabled={pending}
				value={label}
				onChange={(e) => setLabel(e.target.value)}
				aria-label={`Edit ${preset.label}`}
				className={`${adminField} flex-1`}
				// biome-ignore lint/a11y/noAutofocus: focus the field the user just chose to edit
				autoFocus
			/>
			<button
				type="button"
				disabled={pending}
				onClick={async () => {
					if (await onSave(label.trim())) setEditing(false);
				}}
				aria-label={`Save ${preset.label}`}
				className={adminIconBtnPrimary}
			>
				<Check size={14} aria-hidden="true" />
			</button>
			<button
				type="button"
				disabled={pending}
				onClick={() => {
					setLabel(preset.label);
					setEditing(false);
				}}
				aria-label={`Cancel editing ${preset.label}`}
				className={adminIconBtn}
			>
				<X size={14} aria-hidden="true" />
			</button>
		</div>
	);
}
