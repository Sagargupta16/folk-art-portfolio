import { afterEach, describe, expect, it, vi } from "vitest";
import { serverEnv } from "./env";

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("admin preview flag", () => {
	// CI runs this suite with KALCHAR_TEST_FIXTURES=1 already set, so every case
	// pins both flags instead of inheriting the outer environment.
	it("is off unless explicitly requested", () => {
		vi.stubEnv("KALCHAR_ADMIN_PREVIEW", "");
		vi.stubEnv("KALCHAR_TEST_FIXTURES", "1");
		expect(serverEnv.adminPreview).toBe(false);
	});

	it("only works on top of the fixture catalog", () => {
		vi.stubEnv("KALCHAR_ADMIN_PREVIEW", "1");
		vi.stubEnv("KALCHAR_TEST_FIXTURES", "");
		expect(() => serverEnv.adminPreview).toThrow("requires KALCHAR_TEST_FIXTURES=1");
	});

	it("is refused on Vercel before any other check", () => {
		vi.stubEnv("KALCHAR_ADMIN_PREVIEW", "1");
		vi.stubEnv("KALCHAR_TEST_FIXTURES", "1");
		vi.stubEnv("VERCEL", "1");
		expect(() => serverEnv.adminPreview).toThrow("cannot be deployed to Vercel");
	});

	it("turns on with both flags set locally", () => {
		vi.stubEnv("KALCHAR_ADMIN_PREVIEW", "1");
		vi.stubEnv("KALCHAR_TEST_FIXTURES", "1");
		expect(serverEnv.adminPreview).toBe(true);
	});
});
