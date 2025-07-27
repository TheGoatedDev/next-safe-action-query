import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useSafeActionQuery, SafeActionError } from "../index.js";
import type { SafeActionFn } from "next-safe-action";

// Test wrapper
const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: 0 },
		},
	});

	return ({ children }: { children: React.ReactNode }) =>
		React.createElement(QueryClientProvider, { client: queryClient }, children);
};

// Create a mock safe action
const createMockSafeAction = (
	mockImplementation: (
		input: any,
	) => Promise<{ data: any; serverError?: string; validationErrors?: any }>,
): SafeActionFn<any, any, any, any, any> => {
	return vi.fn(mockImplementation) as any;
};

// Helper functions for creating mock results (without undefined to avoid exactOptionalPropertyTypes issues)
const createSuccessResult = (data: any) => Promise.resolve({ data });

const createServerErrorResult = (error: string) =>
	Promise.resolve({ data: undefined, serverError: error });

const createValidationErrorResult = (validationErrors: any) =>
	Promise.resolve({ data: undefined, validationErrors });

describe("useSafeActionQuery", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Success handling", () => {
		it("should handle successful action execution", async () => {
			const mockData = { id: 1, message: "Success!" };
			const mockAction = createMockSafeAction(async () =>
				createSuccessResult(mockData),
			);

			const { result } = renderHook(
				() =>
					useSafeActionQuery(["test"], mockAction, {
						actionInput: { test: "input" },
					}),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockData);
			expect(result.current.error).toBeNull();
			expect(result.current.isError).toBe(false);
		});
	});

	describe("Error handling", () => {
		it("should handle server errors correctly", async () => {
			const errorMessage = "Server error occurred";
			const mockAction = createMockSafeAction(async () =>
				createServerErrorResult(errorMessage),
			);

			const { result } = renderHook(
				() =>
					useSafeActionQuery(["test-error"], mockAction, {
						actionInput: {},
					}),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toBeInstanceOf(SafeActionError);
			if (result.current.error instanceof SafeActionError) {
				expect(result.current.error.type).toBe("server");
				expect(result.current.error.message).toBe(errorMessage);
			}
		});

		it("should handle validation errors correctly", async () => {
			const validationErrors = {
				_errors: ["Validation failed"],
				field: { _errors: ["Field is required"] },
			};
			const mockAction = createMockSafeAction(async () =>
				createValidationErrorResult(validationErrors),
			);

			const { result } = renderHook(
				() =>
					useSafeActionQuery(["test-validation"], mockAction, {
						actionInput: {},
					}),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toBeInstanceOf(SafeActionError);
			if (result.current.error instanceof SafeActionError) {
				expect(result.current.error.type).toBe("validation");
				expect(result.current.error.details).toEqual(validationErrors);
			}
		});

		it("should handle null/undefined data as errors", async () => {
			const mockAction = createMockSafeAction(async () => ({ data: null }));

			const { result } = renderHook(
				() =>
					useSafeActionQuery(["null-data"], mockAction, {
						actionInput: {},
					}),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toBeInstanceOf(SafeActionError);
			if (result.current.error instanceof SafeActionError) {
				expect(result.current.error.message).toBe(
					"No data returned from action",
				);
				expect(result.current.error.type).toBe("server");
			}
		});

		it("should handle network errors correctly", async () => {
			const networkError = new Error("Network failure");
			const mockAction = vi.fn().mockRejectedValue(networkError);

			const { result } = renderHook(
				() =>
					useSafeActionQuery(["network-error"], mockAction, {
						actionInput: {},
					}),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toBeInstanceOf(SafeActionError);
			if (result.current.error instanceof SafeActionError) {
				expect(result.current.error.type).toBe("network");
				expect(result.current.error.message).toContain("Network error:");
				expect(result.current.error.details).toBe(networkError);
			}
		});
	});

	describe("Retry logic", () => {
		it("should not retry validation errors", async () => {
			const validationErrors = { _errors: ["Invalid input"] };
			const mockAction = createMockSafeAction(async () =>
				createValidationErrorResult(validationErrors),
			);

			const { result } = renderHook(
				() =>
					useSafeActionQuery(["no-retry-validation"], mockAction, {
						actionInput: {},
					}),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			// Should only be called once (no retries)
			expect(mockAction).toHaveBeenCalledTimes(1);
		});

		it("should not retry server errors", async () => {
			const serverError = "Internal server error";
			const mockAction = createMockSafeAction(async () =>
				createServerErrorResult(serverError),
			);

			const { result } = renderHook(
				() =>
					useSafeActionQuery(["no-retry-server"], mockAction, {
						actionInput: {},
					}),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			// Should only be called once (no retries)
			expect(mockAction).toHaveBeenCalledTimes(1);
		});
	});

	describe("React Query options", () => {
		it("should pass through React Query options", async () => {
			const mockData = { test: "data" };
			const mockAction = createMockSafeAction(async () =>
				createSuccessResult(mockData),
			);

			const { result } = renderHook(
				() =>
					useSafeActionQuery(["rq-options"], mockAction, {
						actionInput: {},
						enabled: false, // This should prevent the query from running
					}),
				{ wrapper: createWrapper() },
			);

			// Wait a bit to ensure the query doesn't run
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(result.current.status).toBe("pending");
			expect(result.current.fetchStatus).toBe("idle");
			expect(mockAction).not.toHaveBeenCalled();
		});
	});
});
