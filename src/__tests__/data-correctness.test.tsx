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

// Simplified mock action factory that handles optional properties correctly
const createMockAction = (returnValue: {
	data: any;
	serverError?: string;
	validationErrors?: any;
}): SafeActionFn<any, any, any, any, any> => {
	return (async () => returnValue) as any;
};

// Create success mock without undefined values
const createSuccessMockAction = (
	data: any,
): SafeActionFn<any, any, any, any, any> => {
	return (async () => ({ data })) as any;
};

// Create error mock
const createErrorMockAction = (
	serverError: string,
): SafeActionFn<any, any, any, any, any> => {
	return (async () => ({ serverError })) as any;
};

// Create validation error mock
const createValidationErrorMockAction = (
	validationErrors: any,
): SafeActionFn<any, any, any, any, any> => {
	return (async () => ({ validationErrors })) as any;
};

describe("Data Correctness & Return Types", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("TypeScript Type Inference Validation", () => {
		it("should correctly infer and preserve complex object types", async () => {
			type ComplexData = {
				user: {
					id: number;
					name: string;
					email: string;
					preferences: {
						theme: string;
						notifications: boolean;
						languages: string[];
					};
				};
				metadata: {
					created: string;
					version: string;
					tags: string[];
				};
			};

			const complexData: ComplexData = {
				user: {
					id: 1,
					name: "John Doe",
					email: "john@example.com",
					preferences: {
						theme: "dark",
						notifications: true,
						languages: ["en", "es"],
					},
				},
				metadata: {
					created: "2023-01-01",
					version: "1.2.3",
					tags: ["user", "premium"],
				},
			};

			const mockAction = createSuccessMockAction(complexData);

			const { result } = renderHook(
				() =>
					useSafeActionQuery<typeof mockAction, ComplexData>(
						["complex-data"],
						mockAction,
						{
							actionInput: { userId: 1 },
						},
					),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			// Test that result.current.data is NOT undefined/unknown
			// These TypeScript property accesses should work without errors
			const data = result.current.data;
			expect(data).toEqual(complexData);

			if (data) {
				// Deep property access - this validates proper type inference
				expect(data.user.id).toBe(1);
				expect(data.user.name).toBe("John Doe");
				expect(data.user.email).toBe("john@example.com");
				expect(data.user.preferences.theme).toBe("dark");
				expect(data.user.preferences.notifications).toBe(true);
				expect(data.user.preferences.languages).toEqual(["en", "es"]);
				expect(data.metadata.created).toBe("2023-01-01");
				expect(data.metadata.version).toBe("1.2.3");
				expect(data.metadata.tags).toEqual(["user", "premium"]);
			}
		});

		it("should correctly infer and preserve array types", async () => {
			type ArrayItem = { id: number; name: string; active: boolean };
			const arrayData: ArrayItem[] = [
				{ id: 1, name: "Item 1", active: true },
				{ id: 2, name: "Item 2", active: false },
				{ id: 3, name: "Item 3", active: true },
			];

			const mockAction = createSuccessMockAction(arrayData);

			const { result } = renderHook(
				() =>
					useSafeActionQuery<typeof mockAction, ArrayItem[]>(
						["array-data"],
						mockAction,
						{
							actionInput: { page: 1 },
						},
					),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			const data = result.current.data;
			expect(Array.isArray(data)).toBe(true);
			expect(data).toHaveLength(3);

			if (data && Array.isArray(data)) {
				// Array element access - validates proper array type inference
				expect(data[0]?.id).toBe(1);
				expect(data[0]?.name).toBe("Item 1");
				expect(data[0]?.active).toBe(true);

				expect(data[2]?.id).toBe(3);
				expect(data[2]?.name).toBe("Item 3");
				expect(data[2]?.active).toBe(true);
			}
		});

		it("should correctly infer primitive types", async () => {
			const stringValue = "Hello World!";
			const mockAction = createSuccessMockAction(stringValue);

			const { result } = renderHook(
				() =>
					useSafeActionQuery<typeof mockAction, string>(
						["string-data"],
						mockAction,
						{
							actionInput: {},
						},
					),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			const data = result.current.data;
			expect(data).toBe(stringValue);
			expect(typeof data).toBe("string");

			if (data) {
				// String methods - validates string type inference
				expect(data.length).toBe(12); // Fixed: "Hello World!" is 12 characters
				expect(data.toUpperCase()).toBe("HELLO WORLD!");
				expect(data.charAt(0)).toBe("H");
			}
		});

		it("should NOT infer data as undefined or unknown", async () => {
			type UserData = {
				id: number;
				name: string;
				profile: {
					email: string;
					settings: {
						theme: "light" | "dark";
						notifications: boolean;
					};
				};
			};

			const userData: UserData = {
				id: 1,
				name: "Test User",
				profile: {
					email: "test@example.com",
					settings: {
						theme: "dark",
						notifications: true,
					},
				},
			};

			const mockAction = createSuccessMockAction(userData);

			const { result } = renderHook(
				() =>
					useSafeActionQuery<typeof mockAction, UserData>(
						["user-data"],
						mockAction,
						{
							actionInput: {},
						},
					),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			// This is the key test - data should be properly typed, not undefined/unknown
			const data = result.current.data;

			// Verify data exists and has the correct structure
			expect(data).toBeDefined();
			expect(data).toEqual(userData);

			if (data) {
				// All these property accesses should work without TypeScript errors
				// If TData was inferred as undefined/unknown, these would fail
				expect(data.id).toBe(1);
				expect(data.name).toBe("Test User");
				expect(data.profile.email).toBe("test@example.com");
				expect(data.profile.settings.theme).toBe("dark");
				expect(data.profile.settings.notifications).toBe(true);

				// Type checking to ensure proper inference
				expect(typeof data.id).toBe("number");
				expect(typeof data.name).toBe("string");
				expect(typeof data.profile.email).toBe("string");
				expect(typeof data.profile.settings.notifications).toBe("boolean");
			}
		});
	});

	describe("Hook Return Structure", () => {
		it("should return all expected useQuery properties", async () => {
			type TestData = { id: number; name: string };
			const mockData: TestData = { id: 1, name: "Test User" };

			const mockAction = createSuccessMockAction(mockData);

			const { result } = renderHook(
				() =>
					useSafeActionQuery<typeof mockAction, TestData>(
						["structure-test"],
						mockAction,
						{
							actionInput: { test: "input" },
						},
					),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			// Verify all expected properties exist and have correct types
			expect(result.current).toHaveProperty("data");
			expect(result.current).toHaveProperty("error");
			expect(result.current).toHaveProperty("isLoading");
			expect(result.current).toHaveProperty("isError");
			expect(result.current).toHaveProperty("isSuccess");
			expect(result.current).toHaveProperty("isPending");
			expect(result.current).toHaveProperty("status");
			expect(result.current).toHaveProperty("fetchStatus");
			expect(result.current).toHaveProperty("refetch");

			// Verify types
			expect(typeof result.current.isLoading).toBe("boolean");
			expect(typeof result.current.isError).toBe("boolean");
			expect(typeof result.current.isSuccess).toBe("boolean");
			expect(typeof result.current.isPending).toBe("boolean");
			expect(typeof result.current.status).toBe("string");
			expect(typeof result.current.fetchStatus).toBe("string");
			expect(typeof result.current.refetch).toBe("function");
		});
	});

	describe("Error Object Correctness", () => {
		it("should create proper SafeActionError for server errors", async () => {
			const errorMessage = "Database connection failed";
			const mockAction = createErrorMockAction(errorMessage);

			const { result } = renderHook(
				() =>
					useSafeActionQuery(["server-error"], mockAction, {
						actionInput: {},
					}),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			const error = result.current.error;
			expect(error).toBeInstanceOf(SafeActionError);
			expect(error).toBeInstanceOf(Error);

			if (error instanceof SafeActionError) {
				expect(error.name).toBe("SafeActionError");
				expect(error.message).toBe(errorMessage);
				expect(error.type).toBe("server");
				expect(error.stack).toBeDefined();
				expect(typeof error.stack).toBe("string");
			}
		});

		it("should create proper SafeActionError for validation errors", async () => {
			const validationErrors = {
				_errors: ["General error"],
				username: { _errors: ["Too short"] },
			};

			const mockAction = createValidationErrorMockAction(validationErrors);

			const { result } = renderHook(
				() =>
					useSafeActionQuery(["validation-error"], mockAction, {
						actionInput: {},
					}),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			const error = result.current.error;
			expect(error).toBeInstanceOf(SafeActionError);

			if (error instanceof SafeActionError) {
				expect(error.type).toBe("validation");
				expect(error.details).toEqual(validationErrors);
				expect(error.message).toBe("General error");
			}
		});

		it("should create proper SafeActionError for network errors", async () => {
			const networkError = new Error("Network timeout");
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

			const error = result.current.error;
			expect(error).toBeInstanceOf(SafeActionError);

			if (error instanceof SafeActionError) {
				expect(error.type).toBe("network");
				expect(error.message).toContain("Network error:");
				expect(error.details).toBe(networkError);
			}
		});
	});
});
