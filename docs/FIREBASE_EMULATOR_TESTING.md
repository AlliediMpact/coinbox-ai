# Firebase Emulator Integration Testing

This document explains the Firebase Emulator integration test setup for the Coinbox AI platform.

## Overview

Firebase Emulator integration tests provide realistic testing of Firestore operations without affecting production data. These tests use the Firebase Emulator Suite to create an isolated, local testing environment.

## Test Categories

### 1. Real-time Listener Tests (`firestore-realtime.integration.test.ts`)

Tests for Firestore's real-time `onSnapshot` functionality:

- **Initial snapshot reception**: Verifies listeners receive data immediately on attachment
- **Update notifications**: Tests real-time updates when documents change
- **Deletion detection**: Ensures listeners detect document deletions
- **Query-based listeners**: Tests filtered real-time queries
- **Multiple simultaneous listeners**: Validates concurrent listener behavior
- **Unsubscribe behavior**: Confirms listeners stop receiving updates after unsubscribe
- **Transaction monitoring**: Tests real-time monitoring use cases

### 2. Rate Limit Firestore Fallback Tests (`trading-rate-limit-firestore.integration.test.ts`)

Tests for trading rate limit middleware fallback to Firestore when Redis is unavailable:

- **Record creation**: Verifies Firestore rate limit records are created
- **Count incrementation**: Tests counter updates within time windows
- **Count-based limits**: Validates enforcement of operation count limits
- **Amount-based limits**: Tests enforcement of transaction amount limits
- **Window expiration**: Verifies counter reset after time window expires
- **Operation type tracking**: Tests separate tracking for different operations (create, match, confirm)
- **Account flagging**: Validates flagging after repeated violations
- **Concurrent requests**: Tests handling of simultaneous requests
- **Data persistence**: Ensures rate limit data persists across restarts

### 3. Data Consistency Tests (`firestore-data-consistency.integration.test.ts`)

Tests for Firestore data consistency and synchronization:

- **CRUD consistency**: Basic create, read, update, delete operations
- **Batch write consistency**: Tests atomic batch operations
- **Transaction consistency**: Validates ACID transaction properties
- **Query consistency**: Ensures query results reflect data state
- **Concurrent operations**: Tests consistency under concurrent load
- **Timestamp ordering**: Validates timestamp-based ordering

## Setup and Configuration

### Firebase Emulator Configuration

The `firebase.json` file configures the Firestore emulator:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "firestore": {
      "port": 8080,
      "host": "127.0.0.1"
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

### Test Utilities

The `firebase-emulator-utils.ts` provides helper functions:

- `initializeTestApp()`: Initialize Firebase client connected to emulator
- `initializeAdminTestApp()`: Initialize Firebase Admin SDK connected to emulator
- `clearFirestoreData()`: Clear all test data between tests
- `createTestDocument()`: Helper to create test documents
- `documentExists()`: Check if document exists
- `getDocumentData()`: Retrieve document data
- `waitFor()`: Wait for conditions (useful for async operations)
- `cleanupTestEnvironment()`: Clean up after tests

## Running Tests

### Start Emulator and Run Tests

```bash
# Option 1: Start emulator and run tests automatically
npm run test:emulator

# Option 2: Manual control
# Terminal 1: Start emulator
npm run emulator:start

# Terminal 2: Run integration tests
npm run test:integration

# Watch mode for development
npm run test:integration:watch
```

### Run Specific Test Files

```bash
# Run only real-time listener tests
npx vitest run src/tests/integration/firestore-realtime.integration.test.ts

# Run only rate limit tests
npx vitest run src/tests/integration/trading-rate-limit-firestore.integration.test.ts

# Run only consistency tests
npx vitest run src/tests/integration/firestore-data-consistency.integration.test.ts
```

## Test Isolation

Each test is isolated through:

1. **Data cleanup**: `clearFirestoreData()` runs before each test
2. **Fresh app instances**: New Firebase app instances for each test run
3. **Separate collections**: Tests use distinct document IDs
4. **Listener cleanup**: All listeners are unsubscribed after tests

## Best Practices

### Writing New Integration Tests

1. **Use test utilities**: Leverage `firebase-emulator-utils.ts` helpers
2. **Clean up resources**: Always unsubscribe listeners and clean up data
3. **Use meaningful IDs**: Document IDs should indicate test purpose
4. **Wait for async operations**: Use `waitFor()` for real-time updates
5. **Test isolation**: Don't depend on other test execution order

### Example Test Structure

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestApp,
  cleanupTestEnvironment,
  clearFirestoreData,
  createTestDocument,
  waitFor,
} from './firebase-emulator-utils';
import { onSnapshot, doc } from 'firebase/firestore';

describe('My Feature Tests', () => {
  let db: any;

  beforeAll(() => {
    const { db: testDb } = initializeTestApp();
    db = testDb;
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  beforeEach(async () => {
    await clearFirestoreData(db);
  });

  it('should test my feature', async () => {
    // Arrange
    await createTestDocument(db, 'collection', 'doc1', { data: 'value' });

    // Act
    // ... perform action

    // Assert
    // ... verify results
  });
});
```

## Troubleshooting

### Emulator Not Starting

```bash
# Check if port 8080 is already in use
lsof -i :8080

# Kill process if needed
kill -9 <PID>

# Restart emulator
npm run emulator:start
```

### Tests Timing Out

- Increase `testTimeout` in `vitest.config.ts`
- Check emulator is running
- Verify network connectivity to localhost

### Data Not Clearing Between Tests

- Ensure `clearFirestoreData()` is called in `beforeEach`
- Check emulator logs for errors
- Restart emulator if needed

### Connection Refused Errors

- Verify emulator is running on port 8080
- Check `EMULATOR_CONFIG` in utils matches `firebase.json`
- Ensure no firewall blocking localhost connections

## Coverage Impact

Integration tests improve coverage for:

- **Real-time listeners**: Validates `onSnapshot` behavior
- **Firestore operations**: Tests actual database interactions
- **Rate limiting fallback**: Covers Firestore fallback when Redis unavailable
- **Data consistency**: Validates transaction and batch operations
- **Error handling**: Tests failure scenarios

## CI/CD Integration

For continuous integration, tests can be run automatically:

```yaml
# Example GitHub Actions workflow
- name: Start Firebase Emulator
  run: npm run emulator:start &
  
- name: Wait for Emulator
  run: sleep 5

- name: Run Integration Tests
  run: npm run test:integration
```

## Monitoring and Debugging

### Emulator UI

Access the Firebase Emulator UI at http://localhost:4000 to:

- View Firestore data
- Inspect documents and collections
- Monitor real-time updates
- Debug test failures

### Debug Logs

Enable debug logging:

```bash
# Set environment variable
export FIRESTORE_EMULATOR_HOST=localhost:8080
export DEBUG=firestore:*

# Run tests with verbose output
npm run test:integration -- --reporter=verbose
```

## Future Enhancements

Potential improvements to the integration test suite:

1. **Auth emulator integration**: Test authentication flows
2. **Storage emulator**: Test file upload/download
3. **Functions emulator**: Test Cloud Functions
4. **Performance testing**: Measure query performance
5. **Load testing**: Test under concurrent load
6. **Security rules testing**: Validate Firestore rules

## References

- [Firebase Emulator Suite Documentation](https://firebase.google.com/docs/emulator-suite)
- [Firestore Testing Best Practices](https://firebase.google.com/docs/firestore/client/test)
- [Vitest Documentation](https://vitest.dev/)
