import { expect, it } from "vitest";
import { failure } from "./action-result";

it("reports a database conflict without returning query text or parameters", () => {
	const error = new Error("Failed query: INSERT INTO leads ... private parameters", {
		cause: { code: "23505" },
	});
	expect(failure(error)).toEqual({
		ok: false,
		message: "An item with that name or identifier already exists.",
	});
});

it("hides unexpected provider details and preserves explicit validation messages", () => {
	const providerError = Object.assign(new Error("Provider credential details"), {
		name: "StorageServiceException",
	});
	expect(failure(providerError).message).not.toContain("credential");
	expect(failure(new Error("Title is required.")).message).toBe("Title is required.");
});
