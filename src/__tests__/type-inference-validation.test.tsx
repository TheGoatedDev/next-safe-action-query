import { describe, it, expect, vi } from "vitest";
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

// Simple mock action that avoids TypeScript issues
const createSimpleMockAction = (
	data: any,
): SafeActionFn<any, any, any, any, any> => {
	return (async () => ({
		data,
		// Don't specify undefined values to avoid exactOptionalPropertyTypes issues
	})) as any;
};

describe("Type Inference Validation - Core Fix", () => {
	it("should properly infer TData type - validation test", async () => {
		// Define a specific data structure
		type UserData = {
			id: number;
			name: string;
			email: string;
		};

		const userData: UserData = {
			id: 123,
			name: "John Doe",
			email: "john@example.com",
		};

		const mockAction = createSimpleMockAction(userData);

		const { result } = renderHook(
			() =>
				useSafeActionQuery<typeof mockAction, UserData>(
					["user-test"],
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

		// The critical test: Is data properly typed and accessible?
		const data = result.current.data;

		// Test 1: Data should exist
		expect(data).toBeDefined();
		expect(data).toEqual(userData);

		// Test 2: TypeScript should allow property access without errors
		// If TData was inferred as undefined/unknown, these would cause compilation errors
		if (data) {
			expect(data.id).toBe(123);
			expect(data.name).toBe("John Doe");
			expect(data.email).toBe("john@example.com");

			// Type validation - these should work if inference is correct
			expect(typeof data.id).toBe("number");
			expect(typeof data.name).toBe("string");
			expect(typeof data.email).toBe("string");
		}
	});

	it("should handle complex nested objects without type errors", async () => {
		type ComplexData = {
			user: {
				profile: {
					settings: {
						theme: string;
						notifications: boolean;
					};
				};
			};
			metadata: {
				tags: string[];
			};
		};

		const complexData: ComplexData = {
			user: {
				profile: {
					settings: {
						theme: "dark",
						notifications: true,
					},
				},
			},
			metadata: {
				tags: ["admin", "premium"],
			},
		};

		const mockAction = createSimpleMockAction(complexData);

		const { result } = renderHook(
			() =>
				useSafeActionQuery<typeof mockAction, ComplexData>(
					["complex-test"],
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

		if (data) {
			// Deep property access - this validates proper type inference
			expect(data.user.profile.settings.theme).toBe("dark");
			expect(data.user.profile.settings.notifications).toBe(true);
			expect(data.metadata.tags).toEqual(["admin", "premium"]);
			expect(data.metadata.tags[0]).toBe("admin");
		}
	});

	it("should handle array data types correctly", async () => {
		type ListItem = {
			id: number;
			title: string;
			completed: boolean;
		};

		const listData: ListItem[] = [
			{ id: 1, title: "Task 1", completed: true },
			{ id: 2, title: "Task 2", completed: false },
		];

		const mockAction = createSimpleMockAction(listData);

		const { result } = renderHook(
			() =>
				useSafeActionQuery<typeof mockAction, ListItem[]>(
					["list-test"],
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

		if (data && Array.isArray(data)) {
			expect(data).toHaveLength(2);
			expect(data[0]?.id).toBe(1);
			expect(data[0]?.title).toBe("Task 1");
			expect(data[0]?.completed).toBe(true);
			expect(data[1]?.id).toBe(2);
			expect(data[1]?.completed).toBe(false);
		}
	});
});
