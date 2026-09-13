"use client";

import { Shield, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { inviteMaintainer, revokeMaintainer } from "../actions";
import { useConfirm } from "./confirm-dialog";
import { adminBtnDestructive, adminBtnPrimary, adminField } from "./controls";
import { useAdminAction } from "./use-admin-action";

interface MaintainerView {
	email: string;
	name: string | null;
	isRoot: boolean;
	addedBy: string | null;
}

/** Sub-label describing how a maintainer got their access. */
function roleLabel(m: MaintainerView): string {
	if (m.isRoot) return "Root maintainer";
	return m.addedBy ? `Added by ${m.addedBy}` : "Maintainer";
}

export function MaintainerManager({
	roster,
	me,
}: Readonly<{ roster: MaintainerView[]; me: string }>) {
	const confirm = useConfirm();
	const { pending, err, run } = useAdminAction();
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");

	return (
		<div className="space-y-6">
			{/* Invite form */}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					if (!email.trim()) return;
					run(
						() => inviteMaintainer(email.trim(), name.trim() || undefined),
						() => {
							setEmail("");
							setName("");
						},
					);
				}}
				className="rounded-(--radius-md) border border-line bg-bg-soft p-4"
			>
				<p className="text-xs font-medium text-muted mb-3">Invite a maintainer</p>
				<div className="flex flex-wrap items-end gap-3">
					<label className="flex flex-col gap-1 text-xs text-muted">
						<span>Google email</span>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="person@gmail.com"
							required
							className={`${adminField} w-60`}
						/>
					</label>
					<label className="flex flex-col gap-1 text-xs text-muted">
						<span>Name (optional)</span>
						<input
							value={name}
							onChange={(e) => setName(e.target.value)}
							className={`${adminField} w-36`}
						/>
					</label>
					<button type="submit" disabled={pending} className={adminBtnPrimary}>
						<UserPlus size={14} />
						Add
					</button>
				</div>
			</form>

			{err ? (
				<p role="alert" className="text-sm text-ruby">
					{err}
				</p>
			) : null}

			{/* Roster */}
			<div className="divide-y divide-line rounded-(--radius-md) border border-line overflow-hidden">
				{roster.map((m) => (
					<div key={m.email} className="flex items-center justify-between gap-3 bg-bg px-4 py-3">
						<div>
							<p className="text-sm font-medium">
								{m.name ? `${m.name} · ` : ""}
								{m.email}
								{m.email === me ? <span className="ml-1.5 text-xs text-accent">(you)</span> : null}
							</p>
							<p className="text-xs text-muted">{roleLabel(m)}</p>
						</div>
						{m.isRoot ? (
							<span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[0.65rem] text-muted">
								<Shield size={10} />
								root
							</span>
						) : (
							<button
								type="button"
								disabled={pending}
								onClick={async () => {
									const ok = await confirm({
										title: `Remove ${m.email}?`,
										body: "They will lose admin access.",
										confirmLabel: "Remove",
									});
									if (ok) run(() => revokeMaintainer(m.email));
								}}
								className={`${adminBtnDestructive} px-2.5 py-1`}
							>
								<Trash2 size={12} />
								Remove
							</button>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
