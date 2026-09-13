import { describe, expect, it } from "vitest";
import { safeAdminCallback } from "./admin-callback";

describe("admin callback destinations", () => {
	it.each([
		undefined,
		"https://example.org/admin",
		"//example.org/admin",
		"/\\example.org/admin",
		"/admin/../../contact",
		"/administrator",
		"/contact",
		"/admin/%5cexample.org",
		"/admin/%2fexample.org",
		"/\texample.org/admin",
	])("rejects an invalid destination: %s", (value) => {
		expect(safeAdminCallback(value)).toBe("/admin");
	});

	it("keeps an admin destination and its query", () => {
		expect(safeAdminCallback("/admin/leads?page=2")).toBe("/admin/leads?page=2");
	});
});
