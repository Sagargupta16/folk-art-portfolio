"use client";

import { AlertTriangle } from "lucide-react";
import { createContext, useCallback, useContext, useId, useState } from "react";
import { Modal } from "./modal";

/**
 * App-style confirmation modal for destructive admin actions, exposed as a
 * promise-returning hook so call sites read like the old window.confirm:
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "Delete X?", confirmLabel: "Delete" })) { ... }
 *
 * The a11y + mobile plumbing (focus trap, ESC, scroll lock, backdrop) lives in
 * the shared <Modal> shell.
 */
interface ConfirmOptions {
	title: string;
	body?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	/** Style the confirm button as destructive (default true). */
	destructive?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
	const ctx = useContext(ConfirmContext);
	if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
	return ctx;
}

interface DialogState extends ConfirmOptions {
	resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: Readonly<{ children: React.ReactNode }>) {
	const [state, setState] = useState<DialogState | null>(null);
	const titleId = useId();

	const confirm = useCallback<ConfirmFn>((opts) => {
		return new Promise<boolean>((resolve) => {
			setState({ ...opts, resolve });
		});
	}, []);

	const settle = useCallback(
		(result: boolean) => {
			state?.resolve(result);
			setState(null);
		},
		[state],
	);

	return (
		<ConfirmContext.Provider value={confirm}>
			{children}
			{state ? (
				<Modal title={state.title} titleId={titleId} onClose={() => settle(false)}>
					<div className="p-5 sm:p-6">
						<div className="flex items-start gap-3">
							{state.destructive !== false ? (
								<span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ruby/10 text-ruby">
									<AlertTriangle size={18} />
								</span>
							) : null}
							<div className="min-w-0 flex-1">
								<h2 id={titleId} className="t-display text-lg">
									{state.title}
								</h2>
								{state.body ? <p className="mt-1.5 text-sm text-muted">{state.body}</p> : null}
							</div>
						</div>
						<div className="mt-6 flex justify-end gap-2.5">
							<button
								type="button"
								onClick={() => settle(false)}
								className="inline-flex min-h-11 items-center rounded-(--radius-sm) border border-line bg-bg px-4 text-sm font-medium text-ink transition-colors hover:bg-bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
							>
								{state.cancelLabel ?? "Cancel"}
							</button>
							<button
								type="button"
								onClick={() => settle(true)}
								className={
									state.destructive !== false
										? "inline-flex min-h-11 items-center rounded-(--radius-sm) bg-ruby px-4 text-sm font-medium text-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ruby"
										: "inline-flex min-h-11 items-center rounded-(--radius-sm) bg-accent px-4 text-sm font-medium text-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
								}
							>
								{state.confirmLabel ?? "Confirm"}
							</button>
						</div>
					</div>
				</Modal>
			) : null}
		</ConfirmContext.Provider>
	);
}
