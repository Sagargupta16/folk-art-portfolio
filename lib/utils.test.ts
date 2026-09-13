import { describe, expect, it } from "vitest";
import { formatBytes, formatEventDate, formatInr } from "./utils";

describe("formatInr", () => {
	it("formats with the INR label and Indian digit grouping", () => {
		expect(formatInr(12500)).toBe("INR 12,500");
		expect(formatInr(100000)).toBe("INR 1,00,000");
	});
	it("handles zero", () => {
		expect(formatInr(0)).toBe("INR 0");
	});
});

describe("formatEventDate", () => {
	it("formats an ISO date as a long en-IN date", () => {
		// 2026-03-12 -> "12 March 2026"
		expect(formatEventDate("2026-03-12")).toBe("12 March 2026");
	});
	it("returns '' for empty input", () => {
		expect(formatEventDate("")).toBe("");
	});
	it("returns '' for an invalid date instead of 'Invalid Date'", () => {
		expect(formatEventDate("not-a-date")).toBe("");
	});
});

describe("formatBytes", () => {
	it("uses KB below a megabyte and one decimal MB above", () => {
		expect(formatBytes(512)).toBe("1 KB");
		expect(formatBytes(860_160)).toBe("840 KB");
		expect(formatBytes(5_452_595)).toBe("5.2 MB");
	});
	it("treats empty or invalid sizes as 0 KB", () => {
		expect(formatBytes(0)).toBe("0 KB");
		expect(formatBytes(Number.NaN)).toBe("0 KB");
	});
});
