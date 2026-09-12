import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArtworkGrid } from "../../app/admin/_components/artwork-grid";
import { ArtworkRow } from "../../app/admin/_components/artwork-row";
import { CategoryManager } from "../../app/admin/_components/category-manager";
import { ConfirmProvider, useConfirm } from "../../app/admin/_components/confirm-dialog";
import { EventImageManager } from "../../app/admin/_components/event-image-manager";
import { EventsManager } from "../../app/admin/_components/events-manager";
import { LeadsManager } from "../../app/admin/_components/leads-manager";
import { Modal } from "../../app/admin/_components/modal";
import { PresetManager } from "../../app/admin/_components/preset-manager";
import { ProfileManager } from "../../app/admin/_components/profile-manager";
import { TestimonialsManager } from "../../app/admin/_components/testimonials-manager";
import { WorkshopManager } from "../../app/admin/_components/workshop-manager";
import type { Artwork, Event } from "../../lib/types";
import { actionState } from "./mock-actions";

const names = ["Alpha", "Bravo", "Charlie"];
const thumbnail =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'/%3E";
const artworks: Artwork[] = names.map((title, order) => ({
	title,
	slug: title.toLowerCase(),
	style: "Gond",
	medium: "Ink",
	status: "archive",
	featured: false,
	aspectRatio: 1,
	order,
	image: `${title}.jpg`,
}));
const event: Event = {
	id: "event-1",
	title: "Gathering",
	eventDate: "2026-09-01",
	images: ["events/one", "events/two", "events/three"],
	featured: false,
	order: 0,
};

function DialogFixture() {
	const confirm = useConfirm();
	const [open, setOpen] = useState(false);
	const [text, setText] = useState("Unsaved draft");
	return (
		<>
			<button type="button" onClick={() => setOpen(true)}>
				Open editor
			</button>
			<button type="button">Background control</button>
			{open ? (
				<Modal title="Draft editor" onClose={() => setOpen(false)}>
					<button type="button" disabled>
						Disabled control
					</button>
					<label>
						Draft <input value={text} onChange={(e) => setText(e.target.value)} />
					</label>
					<button
						type="button"
						onClick={() => confirm({ title: "Delete draft?", confirmLabel: "Delete" })}
					>
						Delete draft
					</button>
				</Modal>
			) : null}
		</>
	);
}

const views = {
	artworks: (
		<ArtworkGrid
			artworks={artworks.map((art) => ({ ...art, status: "archive", thumb: thumbnail }))}
		/>
	),
	artworkEditor: <ArtworkRow art={artworks[0]!} thumb={thumbnail} categories={["Gond"]} />,
	categories: (
		<CategoryManager
			categories={names.map((name, order) => ({ id: name, name, order }))}
			usage={{}}
		/>
	),
	workshops: (
		<WorkshopManager
			workshops={names.map((title, order) => ({
				slug: title.toLowerCase(),
				title,
				blurb: "Paint together.",
				order,
			}))}
		/>
	),
	presets: (
		<PresetManager
			presets={names.map((label, order) => ({ id: label, label, kind: "size", order }))}
		/>
	),
	events: <EventsManager events={[event]} />,
	eventImages: <EventImageManager event={event} />,
	profile: <ProfileManager showHomeIntro={false} imageKey="profile/artist" />,
	leads: (
		<LeadsManager
			leads={[
				{
					id: "lead-1",
					name: "Mira",
					contact: "mira@example.invalid",
					brief: "A forest scene.",
					status: "new",
					createdAt: "2026-09-01",
				},
			]}
		/>
	),
	testimonials: (
		<TestimonialsManager
			testimonials={[
				{
					id: "testimonial-1",
					quote: "Beautiful work.",
					authorName: "Mira",
					featured: false,
					order: 0,
				},
			]}
			artworkSlugs={["alpha"]}
		/>
	),
	dialogs: <DialogFixture />,
};

declare global {
	interface Window {
		adminTest: typeof actionState;
		mountAdmin: (view: keyof typeof views) => void;
	}
}

window.adminTest = actionState;
const root = createRoot(document.getElementById("fixture")!);
window.mountAdmin = (view) => {
	root.render(
		<StrictMode>
			<ConfirmProvider>{views[view]}</ConfirmProvider>
		</StrictMode>,
	);
};
