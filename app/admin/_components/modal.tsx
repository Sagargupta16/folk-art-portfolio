"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

let openDialogs = 0;
let previousOverflow = "";

/**
 * Native modal dialogs isolate background content, trap focus, and give only
 * the topmost dialog Escape handling, including nested confirmations.
 */
export function Modal({
	title,
	titleId,
	onClose,
	children,
	size = "sm",
	showClose = false,
}: Readonly<{
	title: string;
	titleId?: string;
	onClose: () => void;
	children: React.ReactNode;
	size?: "sm" | "lg";
	/** Show an explicit X button in the header (used by the editor). */
	showClose?: boolean;
}>) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const generatedTitleId = useId();
	const labelledBy = titleId ?? generatedTitleId;

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		const trigger = document.activeElement;
		if (openDialogs === 0) {
			previousOverflow = document.body.style.overflow;
			document.body.style.overflow = "hidden";
		}
		openDialogs += 1;
		dialog.showModal();
		return () => {
			dialog.close();
			openDialogs -= 1;
			if (openDialogs === 0) document.body.style.overflow = previousOverflow;
			if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
		};
	}, []);

	function trapTab(event: React.KeyboardEvent<HTMLDialogElement>) {
		const dialog = dialogRef.current;
		if (event.key !== "Tab" || !dialog || event.defaultPrevented) return;
		if (event.target instanceof Element && event.target.closest("dialog") !== dialog) return;
		const controls = Array.from(
			dialog.querySelectorAll<HTMLElement>(
				"button, [href], input, select, textarea, [tabindex], [contenteditable]",
			),
		).filter(
			(control) =>
				control.tabIndex >= 0 &&
				!control.matches(":disabled") &&
				control.getClientRects().length > 0 &&
				!control.closest("[inert]"),
		);
		const first = controls[0];
		const last = controls.at(-1);
		if (!first || !last) {
			event.preventDefault();
			dialog.focus();
		} else if (!controls.includes(document.activeElement as HTMLElement)) {
			event.preventDefault();
			(event.shiftKey ? last : first).focus();
		} else if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	return (
		<dialog
			ref={dialogRef}
			aria-labelledby={labelledBy}
			onKeyDown={trapTab}
			onCancel={(event) => {
				event.preventDefault();
				event.stopPropagation();
				onClose();
			}}
			onClick={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
			className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none place-items-center overflow-y-auto bg-transparent p-3 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-sm open:grid sm:p-4"
		>
			<div
				className={`relative flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-(--radius-md) border border-line bg-bg shadow-e5 sm:max-h-[calc(100dvh-2rem)] ${
					size === "lg" ? "max-w-lg" : "max-w-sm"
				}`}
			>
				{showClose ? (
					<div className="flex items-center justify-between border-b border-line px-5 py-3.5">
						<h2 id={labelledBy} className="t-display text-lg">
							{title}
						</h2>
						<button
							type="button"
							onClick={onClose}
							aria-label="Close"
							className="grid h-11 w-11 place-items-center rounded-(--radius-sm) text-muted transition-colors hover:bg-bg-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
						>
							<X size={16} />
						</button>
					</div>
				) : titleId ? null : (
					<h2 id={labelledBy} className="sr-only">
						{title}
					</h2>
				)}
				{children}
			</div>
		</dialog>
	);
}
