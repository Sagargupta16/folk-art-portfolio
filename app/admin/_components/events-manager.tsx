"use client";

import { CalendarDays, Pin, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Event } from "@/lib/types";
import { cn } from "@/lib/utils";
import { createEvent, deleteEvent, setEventFeatured } from "../event-actions";
import { useConfirm } from "./confirm-dialog";
import {
	adminBtn,
	adminBtnDestructive,
	adminBtnPrimary,
	adminField,
	adminIconBtn,
	adminLabel,
} from "./controls";
import { EventImageManager } from "./event-image-manager";
import { EventMetaEditor } from "./event-meta-editor";
import { stageFormImages } from "./stage-image";
import { useAdminAction } from "./use-admin-action";
import { useServerSyncedList } from "./use-server-synced-list";

/** Label for the multi-file photo picker, reflecting how many are selected. */
function photoPickerLabel(count: number): string {
	if (count === 0) return "Choose photos (you can select several)";
	return `${count} photo${count === 1 ? "" : "s"} selected`;
}

export function EventsManager({ events: initial }: Readonly<{ events: Event[] }>) {
	const confirm = useConfirm();
	const { pending, err, run } = useAdminAction();
	const [items, setItems] = useServerSyncedList(initial);

	const handleDelete = (id: string) => {
		run(
			() => deleteEvent(id),
			() => setItems((prev) => prev.filter((i) => i.id !== id)),
		);
	};

	const handleTogglePin = (event: Event) => {
		run(
			() => setEventFeatured(event.id, !event.featured),
			() =>
				setItems((prev) =>
					prev.map((e) => (e.id === event.id ? { ...e, featured: !event.featured } : e)),
				),
		);
	};

	return (
		<div className="space-y-6">
			<CreateEventForm
				pending={pending}
				onCreate={(fd, reset) =>
					run(async () => {
						await stageFormImages(fd);
						return createEvent(fd);
					}, reset)
				}
			/>

			{err ? (
				<p role="alert" className="text-sm text-ruby">
					{err}
				</p>
			) : null}

			<p className="text-xs text-muted">
				Events show newest first. Pin one to keep it at the top regardless of date.
			</p>

			<ul className="space-y-3">
				{items.map((event) => (
					<li
						key={event.id}
						className="rounded-(--radius-sm) border border-line bg-bg transition-all duration-(--duration-fast)"
					>
						<EventItem
							event={event}
							pending={pending}
							onTogglePin={() => handleTogglePin(event)}
							onDelete={async () => {
								const ok = await confirm({
									title: `Delete "${event.title}"?`,
									body: "This removes the event and all its photos from the site.",
									confirmLabel: "Delete",
								});
								if (ok) handleDelete(event.id);
							}}
						/>
					</li>
				))}
				{items.length === 0 ? (
					<li className="rounded-(--radius-sm) border border-dashed border-line p-6 text-center text-sm text-muted">
						No events yet. Add one above.
					</li>
				) : null}
			</ul>
		</div>
	);
}

function CreateEventForm({
	pending,
	onCreate,
}: Readonly<{ pending: boolean; onCreate: (fd: FormData, reset: () => void) => void }>) {
	const [fileCount, setFileCount] = useState(0);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				const form = e.currentTarget;
				onCreate(new FormData(form), () => {
					form.reset();
					setFileCount(0);
				});
			}}
			className="rounded-(--radius-md) border border-line bg-bg-soft p-4"
		>
			<p className="mb-3 text-xs font-medium text-muted">Add an event</p>
			<div className="grid gap-3 sm:grid-cols-2">
				<div className={adminLabel}>
					<label htmlFor="new-event-title">Title *</label>
					<input
						id="new-event-title"
						name="title"
						placeholder="e.g. Monsoon exhibition"
						required
						className={adminField}
					/>
				</div>
				<div className={adminLabel}>
					<label htmlFor="new-event-date">Event date *</label>
					<input id="new-event-date" name="eventDate" type="date" required className={adminField} />
				</div>
				<div className={`${adminLabel} sm:col-span-2`}>
					<label htmlFor="new-event-category">Category</label>
					<input
						id="new-event-category"
						name="category"
						placeholder="e.g. Exhibition or workshop"
						className={adminField}
					/>
				</div>
				<div className={`${adminLabel} sm:col-span-2`}>
					<label htmlFor="new-event-description">Description</label>
					<textarea
						id="new-event-description"
						name="description"
						placeholder="A short summary of the gathering"
						rows={3}
						className={adminField}
					/>
				</div>
				<div className="sm:col-span-2">
					<label className="flex cursor-pointer items-center gap-3 rounded-(--radius-sm) border border-dashed border-line px-4 py-3 text-sm text-muted transition-colors hover:border-accent hover:text-accent focus-within:ring-2 focus-within:ring-accent">
						<Plus size={18} aria-hidden="true" />
						<span>{photoPickerLabel(fileCount)}</span>
						<input
							disabled={pending}
							name="images"
							type="file"
							accept="image/jpeg,image/png,image/webp"
							multiple
							onChange={(e) => setFileCount(e.currentTarget.files?.length ?? 0)}
							className="sr-only"
						/>
					</label>
				</div>
			</div>
			<button type="submit" disabled={pending} className={`${adminBtnPrimary} mt-4 w-full`}>
				<Plus size={14} />
				{pending ? "Adding..." : "Add event"}
			</button>
		</form>
	);
}

function EventItem({
	event,
	pending,
	onTogglePin,
	onDelete,
}: Readonly<{
	event: Event;
	pending: boolean;
	onTogglePin: () => void;
	onDelete: () => void;
}>) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div>
			<div className="flex items-center gap-3 p-3">
				<div className="min-w-0 flex-1">
					<p className="flex items-center gap-1.5 truncate text-sm font-medium">
						{event.featured ? (
							<Pin size={12} className="shrink-0 fill-accent/20 text-accent" aria-label="Pinned" />
						) : null}
						{event.title}
					</p>
					<p className="flex items-center gap-1.5 truncate text-xs text-muted">
						<CalendarDays size={11} />
						{new Date(event.eventDate).toLocaleDateString("en-IN", {
							day: "numeric",
							month: "short",
							year: "numeric",
						})}
						<span aria-hidden="true">·</span>
						{event.images.length} photo{event.images.length === 1 ? "" : "s"}
					</p>
				</div>
				<button
					type="button"
					disabled={pending}
					onClick={onTogglePin}
					aria-pressed={event.featured}
					aria-label={event.featured ? "Unpin event" : "Pin event to top"}
					title={event.featured ? "Pinned to top (tap to unpin)" : "Pin to top"}
					className={cn(
						adminIconBtn,
						event.featured ? "border-accent text-accent" : "border-line text-muted",
					)}
				>
					<Pin
						size={14}
						aria-hidden="true"
						className={event.featured ? "fill-accent/20" : undefined}
					/>
				</button>
				<button
					type="button"
					aria-expanded={expanded}
					aria-controls={`event-editor-${event.id}`}
					onClick={() => setExpanded((v) => !v)}
					className={`${adminBtn} min-w-11 px-2 py-1`}
				>
					{expanded ? "Close" : "Edit"}
				</button>
				<button
					type="button"
					disabled={pending}
					onClick={onDelete}
					aria-label={`Delete ${event.title}`}
					className={`${adminBtnDestructive} min-w-11 px-2 py-1`}
				>
					<Trash2 size={14} aria-hidden="true" />
				</button>
			</div>

			{expanded ? (
				<div id={`event-editor-${event.id}`} className="space-y-5 border-t border-line p-4">
					<EventMetaEditor event={event} />
					<EventImageManager event={event} />
				</div>
			) : null}
		</div>
	);
}
