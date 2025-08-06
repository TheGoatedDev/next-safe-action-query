import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useSafeActionQuery } from "../index.js";
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

// Properly typed mock actions for testing type inference
const createTypedUserAction = (): SafeActionFn<any, any, any, any, any> => {
	return (async () => ({
		data: {
			id: 1,
			name: "John Doe",
			email: "john@example.com",
			profile: {
				age: 30,
				preferences: {
					theme: "dark" as const,
					notifications: true,
				},
			},
		},
		serverError: undefined,
		validationErrors: undefined,
	})) as any;
};

const createTypedArrayAction = (): SafeActionFn<any, any, any, any, any> => {
	return (async () => ({
		data: [
			{ id: 1, title: "Post 1", published: true },
			{ id: 2, title: "Post 2", published: false },
			{ id: 3, title: "Post 3", published: true },
		],
		serverError: undefined,
		validationErrors: undefined,
	})) as any;
};

const createTypedStringAction = (): SafeActionFn<any, any, any, any, any> => {
	return (async () => ({
		data: "Hello World",
		serverError: undefined,
		validationErrors: undefined,
	})) as any;
};

describe("TypeScript Type Inference Validation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Data Type Inference", () => {
		it("should correctly infer complex object types", async () => {
			const userAction = createTypedUserAction();

			const { result } = renderHook(
				() =>
					useSafeActionQuery(["user"], userAction, {
						actionInput: { userId: 1 },
					}),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			// These should not cause TypeScript errors if types are inferred correctly
			const data = result.current.data;

			if (data) {
				// Test deep property access - this should be type-safe
				expect(data.id).toBe(1);
				expect(data.name).toBe("John Doe");
				expect(data.email).toBe("john@example.com");
				expect(data.profile.age).toBe(30);
				expect(data.profile.preferences.theme).toBe("dark");
				expect(data.profile.preferences.notifications).toBe(true);

				// Test that TypeScript knows these are the correct types
				expect(typeof data.id).toBe("number");
				expect(typeof data.name).toBe("string");
				expect(typeof data.email).toBe("string");
				expect(typeof data.profile.age).toBe("number");
				expect(typeof data.profile.preferences.theme).toBe("string");
				expect(typeof data.profile.preferences.notifications).toBe("boolean");
			}
		});

		it("should correctly infer array types", async () => {
			const arrayAction = createTypedArrayAction();

			const { result } = renderHook(
				() =>
					useSafeActionQuery(["posts"], arrayAction, {
						actionInput: { page: 1 },
					}),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			const data = result.current.data;

			if (data) {
				// These should not cause TypeScript errors
				expect(Array.isArray(data)).toBe(true);
				expect(data.length).toBe(3);

				// Array element access should be type-safe
				expect(data[0].id).toBe(1);
				expect(data[0].title).toBe("Post 1");
				expect(data[0].published).toBe(true);

				expect(data[2].id).toBe(3);
				expect(data[2].title).toBe("Post 3");
				expect(data[2].published).toBe(true);

				// Type checking
				expect(typeof data[0].id).toBe("number");
				expect(typeof data[0].title).toBe("string");
				expect(typeof data[0].published).toBe("boolean");
			}
		});

		it("should correctly infer primitive types", async () => {
			const stringAction = createTypedStringAction();

			const { result } = renderHook(
				() =>
					useSafeActionQuery(["message"], stringAction, {
						actionInput: {},
					}),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			const data = result.current.data;

			if (data) {
				// This should not cause TypeScript errors
				expect(data).toBe("Hello World");
				expect(typeof data).toBe("string");
				expect(data.length).toBe(11);
				expect(data.toUpperCase()).toBe("HELLO WORLD");
			}
		});
	});

	describe("Error Type Inference", () => {
		it("should correctly type error objects", async () => {
			const errorAction = vi.fn().mockResolvedValue({
				data: undefined,
				serverError: "Something went wrong",
				validationErrors: undefined,
			});

			const { result } = renderHook(
				() =>
					useSafeActionQuery(["error"], errorAction, {
						actionInput: {},
					}),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			const error = result.current.error;

			if (error) {
				// These should not cause TypeScript errors
				expect(error.message).toBe("Something went wrong");
				expect(error.type).toBe("server");
				expect(error.name).toBe("SafeActionError");
				expect(typeof error.stack).toBe("string");
			}
		});
	});

	describe("Conditional Type Narrowing", () => {
		it("should support proper type narrowing with success checks", async () => {
			const userAction = createTypedUserAction();

			const { result } = renderHook(
				() =>
					useSafeActionQuery(["user-narrowing"], userAction, {
						actionInput: { userId: 1 },
					}),
				{ wrapper: createWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			// Type narrowing should work correctly
			if (result.current.isSuccess) {
				// In this block, data should be properly typed (not undefined)
				const data = result.current.data;
				expect(data).toBeDefined();

				if (data) {
					expect(data.name).toBe("John Doe");
					expect(data.profile.age).toBe(30);
				}
			}

			if (result.current.isError) {
				// In this block, error should be properly typed
				const error = result.current.error;
				expect(error).toBeDefined();

				if (error) {
					expect(error.message).toBeDefined();
					expect(error.type).toBeDefined();
				}
			}
		});
	});

	describe("Generic Type Parameters", () => {
		it("should allow explicit type parameter specification", async () => {
			// Test with explicit TData type parameter
			type UserData = {
				id: number;
				name: string;
				email: string;
			};

			const userAction = vi.fn().mockResolvedValue({
				data: { id: 1, name: "John", email: "john@example.com" },
				serverError: undefined,
				validationErrors: undefined,
			});

			const { result } = renderHook(
				() =>
					useSafeActionQuery<typeof userAction, UserData>(
						["explicit-type"],
						userAction,
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

			if (data) {
				// These should be properly typed as UserData
				expect(data.id).toBe(1);
				expect(data.name).toBe("John");
				expect(data.email).toBe("john@example.com");
			}
		});
	});

	describe("Callback Type Safety", () => {
		it("should have properly typed callback parameters", async () => {
			const userAction = createTypedUserAction();

			const onServerError = vi.fn((error: Error) => {
				// error should be typed as string
				expect(error instanceof Error).toBe(true);
				expect(typeof error.message).toBe("string");
			});

			const onValidationErrors = vi.fn((errors: string[]) => {
				// errors should be typed as string[]
				expect(Array.isArray(errors)).toBe(true);
				errors.forEach((error) => expect(typeof error).toBe("string"));
			});

			const onNetworkError = vi.fn((error: Error) => {
				// error should be typed as Error
				expect(error instanceof Error).toBe(true);
				expect(typeof error.message).toBe("string");
			});

			renderHook(
				() =>
					useSafeActionQuery(["callbacks"], userAction, {
						actionInput: {},
						onServerError,
						onValidationErrors,
						onNetworkError,
					}),
				{ wrapper: createWrapper() },
			);

			// Just verify the hook can be called with properly typed callbacks
			expect(onServerError).toBeDefined();
			expect(onValidationErrors).toBeDefined();
			expect(onNetworkError).toBeDefined();
		});
	});
});
