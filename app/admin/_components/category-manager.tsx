"use client";

import { Check, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { createCategory, deleteCategory, renameCategory, reorderCategories } from "../actions";
import { useConfirm } from "./confirm-dialog";
import {
	adminBtn,
	adminBtnPrimary,
	adminField,
	adminIconBtn,
	adminIconBtnDestructive,
	adminIconBtnPrimary,
} from "./controls";
import { ReorderBar } from "./reorder-bar";
import { ReorderHandle } from "./reorder-handle";
import { SAVED_BADGE_DURATION_MS, useAdminAction } from "./use-admin-action";
import { useReorder } from "./use-reorder";
import { useServerSyncedList } from "./use-server-synced-list";

/** Map of category name -> how many artworks use it (for the delete guard hint). */
type UsageMap = Record<string, number>;

export function CategoryManager({
	categories: initial,
	usage,
}: Readonly<{ categories: Category[]; usage: UsageMap }>) {
	const confirm = useConfirm();
	const { pending, err, run } = useAdminAction();
	const [baseline, setBaseline] = useState(initial);
	// Adopt fresh server data after a create (router.refresh), keeping the
	// reorder baseline in step.
	const [items, setItems] = useServerSyncedList(initial, setBaseline);
	const [saved, setSaved] = useState(false);
	const [newName, setNewName] = useState("");
	const { dragging, over, dragProps, move } = useReorder(items, setItems, pending);

	const handleSaveOrder = () => {
		setSaved(false);
		return run(
			() => reorderCategories(items.map((i) => i.id)),
			() => {
				setBaseline(items);
				setSaved(true);
				setTimeout(() => setSaved(false), SAVED_BADGE_DURATION_MS);
			},
		);
	};

	const handleDelete = (id: string) => {
		run(
			() => deleteCategory(id),
			() => {
				setItems((prev) => prev.filter((i) => i.id !== id));
				setBaseline((prev) => prev.filter((i) => i.id !== id));
			},
		);
	};

	const hasOrderChanges = items.some((item, i) => item.id !== baseline[i]?.id);

	return (
		<div className="space-y-6">
			{/* Add */}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					if (!newName.trim()) return;
					run(
						() => createCategory(newName),
						() => setNewName(""),
					);
				}}
				className="rounded-(--radius-md) border border-line bg-bg-soft p-4"
			>
				<p className="mb-3 text-xs font-medium text-muted">Add a category</p>
				<div className="flex items-center gap-2">
					<input
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						aria-label="Category name"
						placeholder="e.g. Warli, Kalamkari, Tanjore"
						className={`${adminField} flex-1`}
					/>
					<button type="submit" disabled={pending} className={adminBtnPrimary}>
						<Plus size={14} />
						Add
					</button>
				</div>
			</form>

			{err ? (
				<p role="alert" className="text-sm text-ruby">
					{err}
				</p>
			) : null}

			{/* List */}
			<ul className="space-y-2">
				{items.map((c, i) => (
					<li
						key={c.id}
						{...dragProps(i)}
						className={cn(
							"rounded-(--radius-sm) border border-line bg-bg transition-all duration-(--duration-fast)",
							dragging === i && "opacity-50",
							over === i && dragging !== i && "border-accent shadow-e1",
						)}
					>
						<CategoryItem
							category={c}
							usageCount={usage[c.name] ?? 0}
							pending={pending}
							reorderHandle={
								<ReorderHandle
									label={c.name}
									index={i}
									count={items.length}
									disabled={pending}
									onMove={(to) => move(i, to)}
								/>
							}
							onSave={(name) => run(() => renameCategory(c.id, name))}
							onDelete={async () => {
								const ok = await confirm({
									title: `Delete category "${c.name}"?`,
									body: "Pieces must be reassigned first; this only removes the empty category.",
									confirmLabel: "Delete",
								});
								if (ok) handleDelete(c.id);
							}}
						/>
					</li>
				))}
				{items.length === 0 ? (
					<li className="rounded-(--radius-sm) border border-dashed border-line p-6 text-center text-sm text-muted">
						No categories yet. Add one above.
					</li>
				) : null}
			</ul>

			{hasOrderChanges ? (
				<ReorderBar
					label="Category order changed"
					pending={pending}
					saved={saved}
					onSave={handleSaveOrder}
					onReset={() => setItems(baseline)}
				/>
			) : null}
		</div>
	);
}

function CategoryItem({
	category,
	usageCount,
	pending,
	reorderHandle,
	onSave,
	onDelete,
}: Readonly<{
	category: Category;
	usageCount: number;
	pending: boolean;
	reorderHandle: React.ReactNode;
	onSave: (name: string) => Promise<boolean>;
	onDelete: () => void;
}>) {
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(category.name);

	if (!editing) {
		return (
			<div className="flex items-center gap-3 p-3">
				{reorderHandle}
				<span className="flex-1 truncate text-sm font-medium">{category.name}</span>
				<span className="t-meta shrink-0 text-[0.65rem]">
					{usageCount} {usageCount === 1 ? "piece" : "pieces"}
				</span>
				<button
					type="button"
					disabled={pending}
					onClick={() => {
						setName(category.name);
						setEditing(true);
					}}
					className={`${adminBtn} min-w-11 px-2 py-1`}
				>
					Rename
				</button>
				<button
					type="button"
					disabled={pending || usageCount > 0}
					onClick={onDelete}
					aria-label={`Delete ${category.name}`}
					title={usageCount > 0 ? "Reassign its pieces before deleting" : "Delete category"}
					className={adminIconBtnDestructive}
				>
					<Trash2 size={14} aria-hidden="true" />
				</button>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2 p-3">
			<input
				disabled={pending}
				value={name}
				onChange={(e) => setName(e.target.value)}
				aria-label={`Rename ${category.name}`}
				className={`${adminField} flex-1`}
				// biome-ignore lint/a11y/noAutofocus: focus the field the user chose to edit
				autoFocus
			/>
			<button
				type="button"
				disabled={pending}
				onClick={async () => {
					if (await onSave(name.trim())) setEditing(false);
				}}
				aria-label={`Save ${category.name}`}
				className={adminIconBtnPrimary}
			>
				<Check size={14} aria-hidden="true" />
			</button>
			<button
				type="button"
				disabled={pending}
				onClick={() => {
					setName(category.name);
					setEditing(false);
				}}
				aria-label={`Cancel renaming ${category.name}`}
				className={adminIconBtn}
			>
				<X size={14} aria-hidden="true" />
			</button>
		</div>
	);
}
