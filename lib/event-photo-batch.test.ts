import { describe, expect, it, vi } from "vitest";
import type { ActionResult } from "./action-result";
import { describePartialBatch, progressLabel, sequencePhotos } from "./event-photo-batch";

const ok: ActionResult = { ok: true };
const fail = (message: string): ActionResult => ({ ok: false, message });

describe("sequencePhotos", () => {
	it("calls the step once per key, in order, and reports every photo saved", async () => {
		const step = vi.fn(async (_key: string, _index: number) => ok);
		const progress: Array<[number, number]> = [];
		const outcome = await sequencePhotos(["a", "b", "c"], step, (p) =>
			progress.push([p.done, p.total]),
		);
		expect(step.mock.calls.map(([key, index]) => [key, index])).toEqual([
			["a", 0],
			["b", 1],
			["c", 2],
		]);
		expect(outcome).toEqual({ saved: 3, total: 3 });
		// Before each step, never after the last: "photo done + 1 of total" is always real.
		expect(progress).toEqual([
			[0, 3],
			[1, 3],
			[2, 3],
		]);
	});

	it("stops at a failure envelope and reports the 1-based photo that failed", async () => {
		const step = vi.fn(async (key: string) => (key === "b" ? fail("Upload expired.") : ok));
		const outcome = await sequencePhotos(["a", "b", "c"], step);
		expect(step).toHaveBeenCalledTimes(2);
		expect(outcome).toEqual({ saved: 1, total: 3, failedAt: 2, message: "Upload expired." });
	});

	it("treats a thrown error the same as a failure envelope", async () => {
		const step = vi.fn(async (key: string) => {
			if (key === "c") throw new Error("Network dropped.");
			return ok;
		});
		const outcome = await sequencePhotos(["a", "b", "c", "d"], step);
		expect(step).toHaveBeenCalledTimes(3);
		expect(outcome).toEqual({ saved: 2, total: 4, failedAt: 3, message: "Network dropped." });
	});

	it("counts photos saved before the sequence through offset", async () => {
		// The create call carried photo 1; this sequence adds photos 2 and 3.
		const progress: Array<[number, number]> = [];
		const outcome = await sequencePhotos(
			["b", "c"],
			async () => ok,
			(p) => progress.push([p.done, p.total]),
			1,
		);
		expect(outcome).toEqual({ saved: 3, total: 3 });
		expect(progress).toEqual([
			[1, 3],
			[2, 3],
		]);
	});

	it("reports a first-photo failure with nothing saved", async () => {
		const outcome = await sequencePhotos(["a", "b"], async () => fail("Rejected."));
		expect(outcome).toEqual({ saved: 0, total: 2, failedAt: 1, message: "Rejected." });
	});

	it("does nothing for an empty batch", async () => {
		const step = vi.fn(async () => ok);
		expect(await sequencePhotos([], step)).toEqual({ saved: 0, total: 0 });
		expect(step).not.toHaveBeenCalled();
	});
});

describe("describePartialBatch", () => {
	it("is silent when every photo landed", () => {
		expect(describePartialBatch({ saved: 3, total: 3 })).toBeNull();
	});

	it("names the failed photo, the saved count, and how many to re-select", () => {
		expect(
			describePartialBatch({
				saved: 5,
				total: 8,
				failedAt: 6,
				message: "The upload expired before it could be processed.",
			}),
		).toBe(
			"Saved 5 of 8 photos. Photo 6 failed: The upload expired before it could be processed. Select the remaining 3 photos and add them again.",
		);
	});

	it("uses the singular when one photo remains and adds a missing full stop", () => {
		expect(
			describePartialBatch({ saved: 2, total: 3, failedAt: 3, message: "Network dropped" }),
		).toBe(
			"Saved 2 of 3 photos. Photo 3 failed: Network dropped. Select the remaining photo and add them again.",
		);
	});

	it("falls back to a generic reason when the failure carried none", () => {
		expect(describePartialBatch({ saved: 0, total: 2, failedAt: 1 })).toContain(
			"Photo 1 failed: Something went wrong. Please try again.",
		);
	});
});

describe("progressLabel", () => {
	it("names the photo about to be sent", () => {
		expect(progressLabel({ done: 0, total: 8 })).toBe("Saving photo 1 of 8");
		expect(progressLabel({ done: 7, total: 8 })).toBe("Saving photo 8 of 8");
	});
});
