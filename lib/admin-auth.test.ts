import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	auth: vi.fn(),
	isMaintainer: vi.fn(),
	adminPreview: vi.fn<() => boolean>(),
	redirect: vi.fn((path: string) => {
		throw new Error(`redirect:${path}`);
	}),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/maintainers", () => ({ isMaintainer: mocks.isMaintainer }));
vi.mock("./env", () => ({
	serverEnv: {
		get adminPreview() {
			return mocks.adminPreview();
		},
	},
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import { PREVIEW_MAINTAINER, requireAdminPage, requireMaintainer } from "./admin-auth";

beforeEach(() => {
	vi.clearAllMocks();
	mocks.auth.mockResolvedValue(null);
	mocks.isMaintainer.mockResolvedValue(false);
	mocks.adminPreview.mockReturnValue(false);
});

describe("private access checks", () => {
	it("renders the fixture preview as a synthetic maintainer without a session", async () => {
		mocks.adminPreview.mockReturnValue(true);
		await expect(requireMaintainer()).resolves.toBe(PREVIEW_MAINTAINER);
		await expect(requireAdminPage()).resolves.toBe(PREVIEW_MAINTAINER);
		expect(mocks.auth).not.toHaveBeenCalled();
		expect(mocks.isMaintainer).not.toHaveBeenCalled();
	});

	it("rejects a direct action without a session before reading the roster", async () => {
		await expect(requireMaintainer()).rejects.toThrow("Not authorized.");
		expect(mocks.isMaintainer).not.toHaveBeenCalled();
	});

	it("rejects a revoked session on the next invocation", async () => {
		mocks.auth.mockResolvedValue({ user: { email: "Maintainer@example.invalid" } });
		mocks.isMaintainer.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
		await expect(requireMaintainer()).resolves.toBe("maintainer@example.invalid");
		await expect(requireMaintainer()).rejects.toThrow("Not authorized.");
	});

	it("sends a revoked session to access denied instead of a login loop", async () => {
		mocks.auth.mockResolvedValue({ user: { email: "revoked@example.invalid" } });
		await expect(requireAdminPage()).rejects.toThrow("redirect:/access-denied");
	});

	it("sends an anonymous page request to login", async () => {
		await expect(requireAdminPage()).rejects.toThrow("redirect:/login?callbackUrl=/admin");
	});
});
