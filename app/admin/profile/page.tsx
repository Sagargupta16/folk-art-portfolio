import { requireAdminPage } from "@/lib/admin-auth";
import { getSetting } from "@/lib/data";
import { AdminPageHeader } from "../_components/admin-page-header";
import { ProfileManager } from "../_components/profile-manager";

/** The profile photo runs the same variant pipeline; see app/admin/page.tsx. */
export const maxDuration = 60;

export default async function AdminProfilePage() {
	await requireAdminPage();
	const [imageKey, showHomeIntro] = await Promise.all([
		getSetting("profileImage"),
		getSetting("showHomeIntro"),
	]);

	return (
		<div className="max-w-2xl space-y-6">
			<AdminPageHeader
				title="Artist profile"
				description="Manage the profile photo and the home-page intro. Changes appear on the About page and home immediately."
			/>
			<ProfileManager imageKey={imageKey} showHomeIntro={showHomeIntro ?? false} />
		</div>
	);
}
