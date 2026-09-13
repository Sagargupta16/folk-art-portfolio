import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	requireMaintainer: vi.fn(),
	select: vi.fn(),
}));
vi.mock("./admin-auth", () => ({ requireMaintainer: mocks.requireMaintainer }));
vi.mock("./db/client", () => ({ db: { select: mocks.select } }));

import { getLeadsPage, getMaintainers } from "./data";

beforeEach(() => {
	vi.clearAllMocks();
	mocks.requireMaintainer.mockRejectedValue(new Error("Not authorized."));
});

describe("private data boundaries", () => {
	it.each([
		["leads", () => getLeadsPage(1)],
		["maintainer roster", () => getMaintainers()],
	])("does not query the %s before authorization", async (_label, read) => {
		await expect(read()).rejects.toThrow("Not authorized.");
		expect(mocks.select).not.toHaveBeenCalled();
	});
});
