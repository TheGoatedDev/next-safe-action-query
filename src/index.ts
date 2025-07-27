"use client";

import {
	type QueryKey,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import type {
	InferSafeActionFnInput,
	InferSafeActionFnResult,
	SafeActionFn,
} from "next-safe-action";

// Custom error class for safe action errors
export class SafeActionError extends Error {
	constructor(
		message: string,
		public readonly type: "server" | "validation" | "network",
		public readonly details?: unknown,
	) {
		super(message);
		this.name = "SafeActionError";
	}
}

// Options for the useSafeActionQuery hook
export interface UseSafeActionQueryOptions<TData, TInput>
	extends Omit<
		UseQueryOptions<TData, SafeActionError>,
		"queryKey" | "queryFn"
	> {
	actionInput: TInput;
	onServerError?: (error: string) => void;
	onValidationErrors?: (errors: string[]) => void;
	onNetworkError?: (error: Error) => void;
}

export type SafeActionQueryOptionsWithOutInput<
	// biome-ignore lint/suspicious/noExplicitAny: next-safe-action compatibility
	TAction extends SafeActionFn<any, any, any, any, any>,
> = Omit<
	UseSafeActionQueryOptions<
		InferSafeActionFnResult<TAction>["data"],
		InferSafeActionFnInput<TAction>["clientInput"]
	>,
	"actionInput"
>;

/**
 * Generic hook for using Next Safe Actions with TanStack Query
 * Uses simple type inference based on usage
 */
export function useSafeActionQuery<
	// biome-ignore lint/suspicious/noExplicitAny: next-safe-action compatibility
	TAction extends SafeActionFn<any, any, any, any, any>,
	TData = InferSafeActionFnResult<TAction>["data"],
	TInput = InferSafeActionFnInput<TAction>["clientInput"],
>(
	queryKey: QueryKey,
	action: TAction,
	options: UseSafeActionQueryOptions<TData, TInput>,
): SafeActionQueryResult<TData> {
	const {
		actionInput,
		onServerError,
		onValidationErrors,
		onNetworkError,
		...queryOptions
	} = options;

	return useQuery<TData, SafeActionError>({
		queryKey,
		queryFn: async (): Promise<TData> => {
			try {
				const result = await action(actionInput);

				// Handle server errors
				if (result?.serverError) {
					onServerError?.(result.serverError);
					throw new SafeActionError(result.serverError, "server");
				}

				// Handle validation errors
				if (result?.validationErrors) {
					const errors = result.validationErrors._errors ?? [];
					onValidationErrors?.(errors);
					throw new SafeActionError(
						errors.join(", ") || "Validation failed",
						"validation",
						result.validationErrors,
					);
				}

				// Ensure we have data
				if (result?.data === undefined || result?.data === null) {
					throw new SafeActionError("No data returned from action", "server");
				}

				return result.data as TData;
			} catch (error) {
				// Handle network/unexpected errors
				if (error instanceof SafeActionError) {
					throw error;
				}

				const networkError =
					error instanceof Error ? error : new Error("Unknown error occurred");
				onNetworkError?.(networkError);
				throw new SafeActionError(
					`Network error: ${networkError.message}`,
					"network",
					networkError,
				);
			}
		},
		retry: (failureCount, error) => {
			// Don't retry validation errors
			if (error instanceof SafeActionError && error.type === "validation") {
				return false;
			}
			// Don't retry server errors (they're likely permanent)
			if (error instanceof SafeActionError && error.type === "server") {
				return false;
			}
			// Retry network errors up to 3 times
			return failureCount < 3;
		},
		// Set reasonable defaults
		staleTime: 30 * 1000, // 30 seconds default
		throwOnError: false, // Return errors as state by default
		...queryOptions,
	});
}

// Helper type for inferring the hook return type
export type SafeActionQueryResult<TData> = ReturnType<
	typeof useQuery<TData, SafeActionError>
>;
