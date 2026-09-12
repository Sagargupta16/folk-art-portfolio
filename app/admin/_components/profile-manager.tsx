"use client";

import { ImagePlus, Trash2, UserCircle } from "lucide-react";
import { useState } from "react";
import { IMAGE_ORIGIN } from "@/lib/image-base";
import { cn } from "@/lib/utils";
import { clearProfileImage, setProfileImage, setShowHomeIntro } from "../event-actions";
import { useConfirm } from "./confirm-dialog";
import { adminBtn, adminBtnDestructive, adminBtnPrimary } from "./controls";
import { stageImage } from "./stage-image";
import { useAdminAction } from "./use-admin-action";

interface ProfileManagerProps {
	imageKey?: string;
	showHomeIntro: boolean;
}

/**
 * Artist profile settings: the avatar shown on About + home, and the toggle
 * that controls whether a short intro appears on the home page. Both persist
 * to the `settings` table via server actions.
 */
export function ProfileManager({ imageKey, showHomeIntro }: Readonly<ProfileManagerProps>) {
	const confirm = useConfirm();
	const { pending, err, run } = useAdminAction();
	const [fileName, setFileName] = useState<string | null>(null);

	const onUpload = (form: HTMLFormElement) => {
		const fd = new FormData(form);
		const file = fd.get("image");
		if (!(file instanceof File) || file.size === 0) return;
		run(
			async () => {
				// Upload the master to R2 first, then submit just its staged key.
				fd.delete("image");
				fd.set("imageKey", await stageImage(file));
				return setProfileImage(fd);
			},
			() => {
				setFileName(null);
				form.reset();
			},
		);
	};

	const onClear = async () => {
		const ok = await confirm({
			title: "Remove profile photo?",
			body: "The About page and home will fall back to the monogram.",
			confirmLabel: "Remove",
		});
		if (ok) run(() => clearProfileImage());
	};

	const onToggleIntro = () => {
		run(() => setShowHomeIntro(!showHomeIntro));
	};

	const previewSrc = imageKey ? `${IMAGE_ORIGIN}/${imageKey}-400.webp` : null;

	return (
		<div className="space-y-8">
			{/* Avatar */}
			<section className="rounded-(--radius-md) border border-line bg-bg p-5 sm:p-6">
				<h2 className="text-sm font-semibold">Profile photo</h2>
				<p className="mt-1 text-xs text-muted">
					Shown on the About page and home. Square or portrait works best. Leave empty to use the
					monogram.
				</p>

				<div className="mt-4 flex items-start gap-5">
					<div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-(--radius-sm) border border-line bg-bg-soft">
						{previewSrc ? (
							// biome-ignore lint/performance/noImgElement: admin-only preview, R2 origin, next/image not configured for this host
							<img src={previewSrc} alt="Current profile" className="h-full w-full object-cover" />
						) : (
							<span className="grid h-full w-full place-items-center text-muted">
								<UserCircle size={32} aria-hidden="true" />
							</span>
						)}
					</div>

					<div className="min-w-0 flex-1 space-y-3">
						<form
							onSubmit={(e) => {
								e.preventDefault();
								onUpload(e.currentTarget);
							}}
							className="space-y-3"
						>
							<label
								className={`${adminBtn} cursor-pointer px-3 py-2 focus-within:ring-2 focus-within:ring-accent`}
							>
								<ImagePlus size={14} />
								{fileName ?? "Choose photo"}
								<input
									disabled={pending}
									name="image"
									type="file"
									accept="image/jpeg,image/png,image/webp"
									onChange={(e) => setFileName(e.currentTarget.files?.[0]?.name ?? null)}
									className="sr-only"
								/>
							</label>
							{fileName ? (
								<button
									type="submit"
									disabled={pending}
									className={`${adminBtnPrimary} ml-2 px-3 py-2`}
								>
									{pending ? "Uploading..." : "Upload"}
								</button>
							) : null}
						</form>

						{imageKey ? (
							<button
								type="button"
								disabled={pending}
								onClick={onClear}
								className={`${adminBtnDestructive} px-3 py-1.5`}
							>
								<Trash2 size={12} />
								Remove photo
							</button>
						) : null}
					</div>
				</div>
			</section>

			{/* Home intro toggle */}
			<section className="rounded-(--radius-md) border border-line bg-bg p-5 sm:p-6">
				<div className="flex items-center justify-between gap-4">
					<div className="min-w-0">
						<h2 className="text-sm font-semibold">Show artist intro on home</h2>
						<p className="mt-1 text-xs text-muted">
							Adds the profile photo and a short intro to the home page About preview.
						</p>
					</div>
					<button
						type="button"
						role="switch"
						aria-checked={showHomeIntro}
						aria-label="Show artist intro on home"
						disabled={pending}
						onClick={onToggleIntro}
						className="grid h-11 w-14 shrink-0 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
					>
						<span
							aria-hidden="true"
							className={cn(
								"relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
								showHomeIntro ? "bg-accent" : "bg-bg-muted",
							)}
						>
							<span
								className={cn(
									"inline-block h-5 w-5 rounded-full bg-bg shadow transition-transform",
									showHomeIntro ? "translate-x-5" : "translate-x-0.5",
								)}
							/>
						</span>
					</button>
				</div>
			</section>

			{err ? (
				<p role="alert" className="text-sm text-ruby">
					{err}
				</p>
			) : null}
		</div>
	);
}
