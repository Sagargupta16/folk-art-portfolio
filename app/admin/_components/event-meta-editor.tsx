"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import type { Event } from "@/lib/types";
import { updateEventMeta } from "../event-actions";
import { adminBtnPrimary, adminField, adminLabel } from "./controls";
import { useAdminAction } from "./use-admin-action";

const SAVED_CONFIRMATION_MS = 2000;

/** Inline editor for an event's text fields (title, date, category, description). */
export function EventMetaEditor({ event }: Readonly<{ event: Event }>) {
	const { pending, err, run } = useAdminAction();
	const [title, setTitle] = useState(event.title);
	const [date, setDate] = useState(event.eventDate.slice(0, 10));
	const [category, setCategory] = useState(event.category ?? "");
	const [description, setDescription] = useState(event.description ?? "");
	const [saved, setSaved] = useState(false);

	const onSave = () => {
		setSaved(false);
		return run(
			() =>
				updateEventMeta(event.id, {
					title: title.trim(),
					eventDate: date,
					category: category.trim() || null,
					description: description.trim() || null,
				}),
			() => {
				setSaved(true);
				setTimeout(() => setSaved(false), SAVED_CONFIRMATION_MS);
			},
		);
	};

	return (
		<div className="space-y-2">
			<div className="grid gap-2 sm:grid-cols-2">
				<div className={adminLabel}>
					<label htmlFor={`event-title-${event.id}`}>Title</label>
					<input
						disabled={pending}
						id={`event-title-${event.id}`}
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className={adminField}
					/>
				</div>
				<div className={adminLabel}>
					<label htmlFor={`event-date-${event.id}`}>Event date</label>
					<input
						disabled={pending}
						id={`event-date-${event.id}`}
						type="date"
						value={date}
						onChange={(e) => setDate(e.target.value)}
						className={adminField}
					/>
				</div>
				<div className={`${adminLabel} sm:col-span-2`}>
					<label htmlFor={`event-category-${event.id}`}>Category</label>
					<input
						disabled={pending}
						id={`event-category-${event.id}`}
						value={category}
						onChange={(e) => setCategory(e.target.value)}
						className={adminField}
					/>
				</div>
				<div className={`${adminLabel} sm:col-span-2`}>
					<label htmlFor={`event-description-${event.id}`}>Description</label>
					<textarea
						disabled={pending}
						id={`event-description-${event.id}`}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={3}
						className={adminField}
					/>
				</div>
			</div>
			<div className="flex items-center gap-2.5">
				<button
					type="button"
					disabled={pending}
					onClick={onSave}
					className={`${adminBtnPrimary} px-3 py-1.5`}
				>
					<Check size={14} aria-hidden="true" />
					Save details
				</button>
				{saved ? (
					<span role="status" className="text-sm text-accent">
						Saved
					</span>
				) : null}
				{err ? (
					<span role="alert" className="text-sm text-ruby">
						{err}
					</span>
				) : null}
			</div>
		</div>
	);
}
