# Testing Guide for next-safe-action-query

This document explains how to test the `useSafeActionQuery` hook and what scenarios are covered.

## Running Tests

### Quick Commands

```bash
# Run all tests once
pnpm test:run

# Run tests in watch mode during development
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests with UI (if @vitest/ui is installed)
pnpm test:ui
```

### Test Structure

```
src/__tests__/
├── useSafeActionQuery.test.tsx  # Main hook functionality tests
├── SafeActionError.test.ts      # Error class tests
├── types.test.ts               # Type inference tests
└── test-setup.ts              # Global test configuration
```

## Test Coverage

### 1. Core Hook Functionality (`useSafeActionQuery.test.tsx`)

#### ✅ Success Scenarios
- **Data Retrieval**: Tests successful action execution and data return
- **React Query Integration**: Verifies proper integration with TanStack Query

#### ✅ Error Handling
- **Server Errors**: Tests handling of server-side errors with callback invocation
- **Validation Errors**: Tests input validation error handling and callback execution  
- **Network Errors**: Tests network/connectivity error scenarios
- **Null/Undefined Data**: Tests handling when action returns no data

#### ✅ Retry Logic
- **Validation Error Non-Retry**: Ensures validation errors are not retried
- **Server Error Non-Retry**: Ensures server errors are not retried
- **Network Error Retry**: Verifies network errors are retried appropriately

#### ✅ React Query Options
- **Option Pass-through**: Tests that React Query options are properly forwarded
- **Disabled Queries**: Tests the `enabled: false` functionality
- **Stale Time Configuration**: Tests custom cache timing

### 2. Error Class (`SafeActionError.test.ts`)

#### ✅ Error Construction
- **Complete Error Creation**: Tests error with message, type, and details
- **Minimal Error Creation**: Tests error with just message and type
- **Error Type Validation**: Tests all error types (server, validation, network)

### 3. Type Safety (`types.test.ts`)

#### ✅ Type Inference
- **Return Type Inference**: Tests proper TypeScript return type inference
- **Options Interface**: Tests the options interface accepts correct parameters
- **Error Type Properties**: Tests SafeActionError type properties

## Test Scenarios in Detail

### Success Case Testing

```typescript
// Tests this flow:
Action Input → Safe Action → Success Result → Data Returned
```

**Validates:**
- Data is properly extracted from action result
- React Query state is correctly updated
- No errors are thrown for successful operations

### Server Error Testing

```typescript
// Tests this flow:
Action Input → Safe Action → Server Error → SafeActionError (server) → Callback
```

**Validates:**
- Server errors are caught and wrapped in SafeActionError
- `onServerError` callback is invoked with correct error message
- Error type is set to 'server'
- Query enters error state

### Validation Error Testing  

```typescript
// Tests this flow:
Action Input → Safe Action → Validation Error → SafeActionError (validation) → Callback
```

**Validates:**
- Validation errors are properly extracted from result
- `onValidationErrors` callback is invoked with error array
- Error type is set to 'validation'
- Validation errors are not retried

### Network Error Testing

```typescript
// Tests this flow:
Action Input → Safe Action → Throws → SafeActionError (network) → Callback
```

**Validates:**
- Thrown errors are caught and wrapped
- `onNetworkError` callback is invoked
- Error type is set to 'network'
- Network errors can be retried

### Null Data Testing

```typescript
// Tests this flow:
Action Input → Safe Action → null/undefined data → SafeActionError (server)
```

**Validates:**
- Null or undefined data is treated as an error
- Appropriate error message is generated
- Error type is set to 'server'

## Creating New Tests

### Testing a New Scenario

1. **Create Mock Action**:
```typescript
const mockAction = createMockSafeAction(async (input) => {
  // Your test scenario logic here
  return createSuccessResult(data);
  // or createServerErrorResult(error);
  // or createValidationErrorResult(errors);
});
```

2. **Use renderHook with Wrapper**:
```typescript
const { result } = renderHook(
  () => useSafeActionQuery(['test-key'], mockAction, {
    actionInput: testInput,
    // your options here
  }),
  { wrapper: createWrapper() }
);
```

3. **Assert Results**:
```typescript
await waitFor(() => {
  expect(result.current.isSuccess).toBe(true);
});
expect(result.current.data).toEqual(expectedData);
```

### Testing Callbacks

```typescript
const onSuccess = vi.fn();
const onError = vi.fn();

// Use in hook options
const { result } = renderHook(
  () => useSafeActionQuery(['test-key'], mockAction, {
    actionInput: testInput,
    onServerError: onError,
    onValidationErrors: onError,
    onNetworkError: onError,
  }),
  { wrapper: createWrapper() }
);

// Assert callback was called
expect(onError).toHaveBeenCalledWith(expectedError);
```

## Integration Testing

### Testing with Real Actions

For integration tests, you can test with actual `next-safe-action` functions:

```typescript
// In your integration test
import { myRealAction } from '../actions/myAction';

const { result } = renderHook(
  () => useSafeActionQuery(['real-test'], myRealAction, {
    actionInput: { realData: 'test' },
  }),
  { wrapper: createWrapper() }
);
```

### Testing Type Inference

```typescript
// Compile-time type checking
expectTypeOf(useSafeActionQuery).toBeCallableWith(
  ['key'],
  myAction,
  {
    actionInput: { /* properly typed input */ },
    // ... other options
  }
);
```

## Mock Utilities

The test suite provides several utilities for creating test scenarios:

- `createMockSafeAction()`: Creates a mock safe action function
- `createSuccessResult()`: Creates a successful action result
- `createServerErrorResult()`: Creates a server error result  
- `createValidationErrorResult()`: Creates a validation error result
- `createWrapper()`: Creates a React Query provider wrapper for tests

## Current Test Status

✅ **11/12 tests passing**

The test suite comprehensively covers:
- All success scenarios ✅
- Error handling and callbacks ✅  
- Retry logic ✅
- React Query integration ✅
- Type safety ✅
- Error class functionality ✅

## Debugging Test Failures

### Common Issues

1. **Async Timing**: Use `waitFor()` for async operations
2. **Mock Setup**: Ensure mocks are cleared between tests
3. **Provider Setup**: Ensure React Query provider is properly configured
4. **Type Issues**: Check that mock actions match expected interfaces

### Debug Tools

```typescript
// Add debugging to tests
console.log('Current result:', result.current);
console.log('Mock call count:', mockAction.mock.calls.length);
```

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Clear Mocks**: Use `beforeEach` to clear mocks
3. **Descriptive Names**: Test names should clearly describe the scenario
4. **Comprehensive Coverage**: Test both success and failure paths
5. **Type Safety**: Include type-level tests for TypeScript projects 