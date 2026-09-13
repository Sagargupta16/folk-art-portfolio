type Outcome = "success" | "failure" | "throw" | "pending";

export const actionState = {
	outcome: "failure" as Outcome,
	calls: [] as Array<{ name: string; args: unknown[] }>,
	refreshes: 0,
	release: undefined as (() => void) | undefined,
};

function action(name: string) {
	return async (...args: unknown[]) => {
		actionState.calls.push({ name, args });
		if (actionState.outcome === "throw") throw new Error("Connection interrupted.");
		if (actionState.outcome === "failure") {
			return { ok: false as const, message: "Change was rejected." };
		}
		if (actionState.outcome === "pending") {
			await new Promise<void>((resolve) => {
				actionState.release = resolve;
			});
		}
		// Creates return the identifiers the real actions do (artwork slug, event id).
		return { ok: true as const, slug: "created-piece", id: "created-event" };
	};
}

const router = {
	refresh() {
		actionState.refreshes += 1;
	},
};

export function useRouter() {
	return router;
}

export const deleteArtwork = action("deleteArtwork");
export const reorderArtworks = action("reorderArtworks");
export const updateArtwork = action("updateArtwork");
export const createArtwork = action("createArtwork");
export const regeneratePalette = action("regeneratePalette");
export const replaceArtworkImage = action("replaceArtworkImage");
export const createCategory = action("createCategory");
export const deleteCategory = action("deleteCategory");
export const renameCategory = action("renameCategory");
export const reorderCategories = action("reorderCategories");
export const createWorkshop = action("createWorkshop");
export const deleteWorkshop = action("deleteWorkshop");
export const updateWorkshop = action("updateWorkshop");
export const reorderWorkshops = action("reorderWorkshops");
export const createOrderPreset = action("createOrderPreset");
export const deleteOrderPreset = action("deleteOrderPreset");
export const updateOrderPreset = action("updateOrderPreset");
export const reorderOrderPresets = action("reorderOrderPresets");
export const createEvent = action("createEvent");
export const deleteEvent = action("deleteEvent");
export const setEventFeatured = action("setEventFeatured");
export const updateEventMeta = action("updateEventMeta");
export const addEventImages = action("addEventImages");
export const removeEventImage = action("removeEventImage");
export const reorderEventImages = action("reorderEventImages");
export const setProfileImage = action("setProfileImage");
export const clearProfileImage = action("clearProfileImage");
export const setShowHomeIntro = action("setShowHomeIntro");
export const deleteLead = action("deleteLead");
export const setLeadStatus = action("setLeadStatus");
export const createTestimonial = action("createTestimonial");
export const deleteTestimonial = action("deleteTestimonial");
export const setTestimonialFeatured = action("setTestimonialFeatured");
export const inviteMaintainer = action("inviteMaintainer");
export const revokeMaintainer = action("revokeMaintainer");

export async function stageImage() {
	return "staging/fixture";
}

export async function stageFormImages(formData: FormData): Promise<number> {
	// Model the upload contract without requesting tickets or contacting storage.
	const files = formData
		.getAll("images")
		.filter((value): value is File => value instanceof File && value.size > 0);
	formData.delete("images");
	files.forEach((_, index) => {
		formData.append("imageKeys", `staging/fixture-${index}`);
	});
	return files.length;
}
