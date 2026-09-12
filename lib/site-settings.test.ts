import { expect, it } from "vitest";
import { parseSetting } from "./site-settings";

it("does not interpret the string false as an enabled home intro", () => {
	expect(parseSetting("showHomeIntro", "false")).toBeUndefined();
	expect(parseSetting("showHomeIntro", false)).toBe(false);
});

it("rejects a structured value where a profile image key is required", () => {
	expect(parseSetting("profileImage", { image: "profile/photo" })).toBeUndefined();
	expect(parseSetting("profileImage", "profile/photo")).toBe("profile/photo");
});
