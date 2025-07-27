import { describe, it, expect } from "vitest";
import { SafeActionError } from "../index.js";

describe("SafeActionError", () => {
	it("should create error with correct properties", () => {
		const message = "Test error message";
		const type = "server";
		const details = { code: 500 };

		const error = new SafeActionError(message, type, details);

		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(SafeActionError);
		expect(error.name).toBe("SafeActionError");
		expect(error.message).toBe(message);
		expect(error.type).toBe(type);
		expect(error.details).toEqual(details);
	});

	it("should work without details parameter", () => {
		const message = "Test error message";
		const type = "validation";

		const error = new SafeActionError(message, type);

		expect(error.message).toBe(message);
		expect(error.type).toBe(type);
		expect(error.details).toBeUndefined();
	});

	it("should handle different error types", () => {
		const serverError = new SafeActionError("Server error", "server");
		const validationError = new SafeActionError(
			"Validation error",
			"validation",
		);
		const networkError = new SafeActionError("Network error", "network");

		expect(serverError.type).toBe("server");
		expect(validationError.type).toBe("validation");
		expect(networkError.type).toBe("network");
	});
});
