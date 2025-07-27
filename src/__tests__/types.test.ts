import { describe, it, expectTypeOf } from "vitest";
import type { SafeActionFn } from "next-safe-action";
import {
	useSafeActionQuery,
	type SafeActionQueryResult,
	SafeActionError,
} from "../index.js";

describe("Type Inference Tests", () => {
	it("should infer correct TData type from action", () => {
		// Mock action that returns { success: boolean }
		const mockAction = (() => {}) as SafeActionFn<any, any, any, any, any>;

		// Test type inference - this would be checked at compile time
		type ResultType = ReturnType<typeof useSafeActionQuery<typeof mockAction>>;

		expectTypeOf<ResultType>().toMatchTypeOf<SafeActionQueryResult<any>>();
	});

	it("should accept proper options interface", () => {
		const mockAction = (() => {}) as SafeActionFn<any, any, any, any, any>;

		expectTypeOf(useSafeActionQuery).toBeCallableWith(["test"], mockAction, {
			actionInput: {},
			onServerError: (error: string) => {},
			onValidationErrors: (errors: string[]) => {},
			onNetworkError: (error: Error) => {},
			enabled: true,
			staleTime: 30000,
		});
	});

	it("should have correct SafeActionError properties", () => {
		expectTypeOf<SafeActionError>()
			.toHaveProperty("type")
			.toEqualTypeOf<"server" | "validation" | "network">();
		expectTypeOf<SafeActionError>()
			.toHaveProperty("message")
			.toEqualTypeOf<string>();
		expectTypeOf<SafeActionError>()
			.toHaveProperty("details")
			.toEqualTypeOf<unknown | undefined>();
	});
});
