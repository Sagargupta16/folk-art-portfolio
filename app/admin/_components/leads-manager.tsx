"use client";

import { Trash2 } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import { formatEventDate } from "@/lib/utils";
import { deleteLead, setLeadStatus } from "../lead-actions";
import { useConfirm } from "./confirm-dialog";
import { adminField, adminIconBtnDestructive } from "./controls";
import { useAdminAction } from "./use-admin-action";
import { useServerSyncedList } from "./use-server-synced-list";

const STATUSES: readonly LeadStatus[] = ["new", "contacted", "closed"];

/**
 * Admin queue for captured custom-order leads. Each lead shows its brief +
 * chosen options, a status dropdown (new/contacted/closed), and a delete
 * control (the PII-removal path). Changes appear after the server accepts them.
 */
export function LeadsManager({ leads: initial }: Readonly<{ leads: Lead[] }>) {
	const { pending, err, run } = useAdminAction();
	const [leads, setLeads] = useServerSyncedList(initial);
	const confirm = useConfirm();

	const onStatus = (id: string, status: LeadStatus) => {
		run(
			() => setLeadStatus(id, status),
			() => setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l))),
		);
	};

	const onDelete = async (id: string) => {
		const ok = await confirm({
			title: "Delete this lead?",
			body: "This permanently removes the enquiry and the details it holds.",
			confirmLabel: "Delete",
			destructive: true,
		});
		if (!ok) return;
		run(
			() => deleteLead(id),
			() => setLeads((prev) => prev.filter((l) => l.id !== id)),
		);
	};

	return (
		<div className="space-y-3">
			{err ? (
				<p role="alert" className="text-sm text-ruby">
					{err}
				</p>
			) : null}
			{leads.length === 0 ? (
				<p className="rounded-(--radius-sm) border border-dashed border-line p-6 text-center text-sm text-muted">
					No enquiries on this page. Custom-order briefs submitted from the site appear here.
				</p>
			) : null}
			<ul className="space-y-3">
				{leads.map((lead) => (
					<li key={lead.id} className="rounded-(--radius-sm) border border-line bg-bg-soft/40 p-4">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div className="min-w-0">
								<p className="text-sm font-medium text-ink">
									{lead.name || "Someone"}
									{lead.style ? <span className="text-muted"> · {lead.style}</span> : null}
								</p>
								<p className="mt-0.5 text-xs text-muted">{formatEventDate(lead.createdAt)}</p>
								{lead.contact ? (
									<p className="mt-1 break-words text-xs text-muted">Contact: {lead.contact}</p>
								) : null}
							</div>
							<div className="flex items-center gap-2">
								<label className="sr-only" htmlFor={`status-${lead.id}`}>
									Lead status
								</label>
								<select
									id={`status-${lead.id}`}
									value={lead.status}
									disabled={pending}
									onChange={(e) => onStatus(lead.id, e.currentTarget.value as LeadStatus)}
									className={adminField}
								>
									{STATUSES.map((s) => (
										<option key={s} value={s}>
											{s}
										</option>
									))}
								</select>
								<button
									type="button"
									disabled={pending}
									onClick={() => onDelete(lead.id)}
									aria-label="Delete lead"
									className={adminIconBtnDestructive}
								>
									<Trash2 size={15} />
								</button>
							</div>
						</div>
						<p className="mt-3 whitespace-pre-wrap text-sm text-ink">{lead.brief}</p>
						{lead.size || lead.budget || lead.timeline ? (
							<dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
								{lead.size ? (
									<div>
										<dt className="inline font-medium">Size: </dt>
										<dd className="inline">{lead.size}</dd>
									</div>
								) : null}
								{lead.budget ? (
									<div>
										<dt className="inline font-medium">Budget: </dt>
										<dd className="inline">{lead.budget}</dd>
									</div>
								) : null}
								{lead.timeline ? (
									<div>
										<dt className="inline font-medium">Timeline: </dt>
										<dd className="inline">{lead.timeline}</dd>
									</div>
								) : null}
							</dl>
						) : null}
					</li>
				))}
			</ul>
		</div>
	);
}
