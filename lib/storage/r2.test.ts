import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { afterEach, describe, expect, it, type MockInstance, vi } from "vitest";

vi.mock("@/lib/env", () => ({
	serverEnv: {
		r2AccountId: "fixture-account",
		r2AccessKeyId: "fixture-access",
		r2SecretAccessKey: "fixture-secret",
		r2Bucket: "fixture-bucket",
		r2PublicBaseUrl: "https://images.example.invalid",
	},
}));

import { deleteObjects, getObjectBuffer, listStagedObjects, objectSize, presignUpload } from "./r2";

afterEach(() => vi.restoreAllMocks());

function mockSend(): MockInstance<(command: unknown) => Promise<unknown>> {
	// The SDK's last overload is callback-based. Exercise its promise overload.
	const send = vi.spyOn(S3Client.prototype, "send") as unknown as MockInstance<
		(command: unknown) => Promise<unknown>
	>;
	return send.mockRejectedValue(new Error("Unexpected storage request"));
}

describe("presigned upload contract", () => {
	it("binds both content type and byte length without an empty-body checksum", async () => {
		const send = mockSend();
		const url = new URL(await presignUpload("staging/fixture", "image/jpeg", 1234));
		expect(url.searchParams.get("X-Amz-SignedHeaders")?.split(";")).toEqual([
			"content-length",
			"content-type",
			"host",
		]);
		expect(url.searchParams.get("X-Amz-Expires")).toBe("900");
		expect(url.searchParams.has("x-amz-checksum-crc32")).toBe(false);
		expect(send).not.toHaveBeenCalled();
	});
});

describe("storage reads", () => {
	it("lists only staging keys with the supplied pagination token", async () => {
		const send = mockSend().mockResolvedValueOnce({ IsTruncated: false, KeyCount: 0 });
		await listStagedObjects("next-page");
		const command = send.mock.calls[0]?.[0] as ListObjectsV2Command;
		expect(command).toBeInstanceOf(ListObjectsV2Command);
		expect(command.input).toEqual({
			Bucket: "fixture-bucket",
			Prefix: "staging/",
			MaxKeys: 1000,
			ContinuationToken: "next-page",
		});
	});

	it.each([
		"NotFound",
		"NoSuchKey",
	])("classifies only a missing object (%s) as absent", async (name) => {
		mockSend().mockRejectedValueOnce(Object.assign(new Error("Missing"), { name }));
		await expect(objectSize("staging/fixture")).resolves.toBeNull();
	});

	it.each([
		"AccessDenied",
		"NoSuchBucket",
		"NetworkingError",
	])("does not describe a provider failure (%s) as an expired upload", async (name) => {
		const cause = Object.assign(new Error("Provider failure"), { name });
		mockSend().mockRejectedValueOnce(cause);
		await expect(objectSize("staging/fixture")).rejects.toMatchObject({
			message: "Could not check the uploaded image in storage. Please try again.",
			cause,
		});
	});

	it("rejects a HEAD response without a byte size", async () => {
		mockSend().mockResolvedValueOnce({});
		await expect(objectSize("staging/fixture")).rejects.toThrow("Could not check");
	});

	it("reads a bounded object without contacting live storage", async () => {
		mockSend().mockResolvedValueOnce({
			Body: {
				transformToWebStream: () =>
					new ReadableStream<Uint8Array>({
						start(controller) {
							controller.enqueue(Buffer.from("image"));
							controller.close();
						},
					}),
			},
		});
		await expect(getObjectBuffer("staging/fixture", 5)).resolves.toEqual(Buffer.from("image"));
	});

	it("cancels a GET exceeding the size limit even when HEAD checked an older object", async () => {
		const cancel = vi.fn();
		mockSend().mockResolvedValueOnce({
			Body: {
				transformToWebStream: () =>
					new ReadableStream<Uint8Array>({
						start(controller) {
							controller.enqueue(new Uint8Array(6));
						},
						cancel,
					}),
			},
		});
		await expect(getObjectBuffer("staging/fixture", 5)).rejects.toThrow("Could not read");
		expect(cancel).toHaveBeenCalled();
	});
});

describe("object cleanup", () => {
	it("reports partial failures from every deletion batch", async () => {
		const send = mockSend()
			.mockResolvedValueOnce({ Errors: [{ Key: "0", Code: "AccessDenied" }] })
			.mockResolvedValueOnce({ Errors: [{ Key: "1000", Code: "InternalError" }] });
		const keys = Array.from({ length: 1001 }, (_, index) => String(index));
		await expect(deleteObjects(keys)).rejects.toThrow(
			"Image cleanup failed for 2 object(s): 0 (AccessDenied), 1000 (InternalError)",
		);
		expect(send).toHaveBeenCalledTimes(2);
		const first = send.mock.calls[0]?.[0];
		const second = send.mock.calls[1]?.[0];
		expect(first).toBeInstanceOf(DeleteObjectsCommand);
		expect((first as DeleteObjectsCommand).input.Delete?.Objects).toHaveLength(1000);
		expect((second as DeleteObjectsCommand).input.Delete?.Objects).toHaveLength(1);
	});

	it("deduplicates keys and skips an empty deletion", async () => {
		const send = mockSend().mockResolvedValue({});
		await deleteObjects([]);
		expect(send).not.toHaveBeenCalled();
		await deleteObjects(["one", "one"]);
		const command = send.mock.calls[0]?.[0] as DeleteObjectsCommand;
		expect(command).toBeInstanceOf(DeleteObjectsCommand);
		expect(command.input.Delete?.Objects).toEqual([{ Key: "one" }]);
	});
});
