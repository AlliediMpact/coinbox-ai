# Firebase Emulator Integration Tests - Quick Start Guide

## What Are These Tests?

Integration tests that validate Firestore operations using the Firebase Emulator Suite. These tests:
- ✅ Use real Firebase SDK (not mocks)
- ✅ Test actual database operations
- ✅ Validate real-time listener behavior
- ✅ Run against local emulator (no production data affected)
- ✅ Are isolated and repeatable

## Quick Start (3 Steps)

### 1. Start the Firebase Emulator

```bash
npm run emulator:start
```

Wait for: `✔ All emulators ready! It is now safe to connect your app.`

### 2. Run Integration Tests (in another terminal)

```bash
npm run test:integration
```

### 3. View Results

```
✅ Test Suites: 2 passed
✅ Tests: 20 passed
⚠️  Trading Rate Limit tests require middleware refactoring
```

## What's Being Tested?

### ✅ Real-time Listeners (8 tests)
- Document updates trigger listeners
- Query filters work correctly
- Multiple listeners don't interfere
- Unsubscribe stops updates

### ✅ Data Consistency (12 tests)
- CRUD operations work as expected
- Batch writes are atomic
- Transactions maintain consistency
- Concurrent operations don't corrupt data

### ⚠️ Trading Rate Limits (9 tests)
- Tests exist but require middleware refactoring
- Current middleware uses server-side only Admin SDK
- Future enhancement needed

## Common Commands

```bash
# Start emulator
npm run emulator:start

# Run integration tests
npm run test:integration

# Run integration tests in watch mode
npm run test:integration:watch

# Run regular unit tests (excludes integration)
npm test

# Run specific integration test
npx vitest run --config vitest.integration.config.ts src/tests/integration/firestore-realtime.integration.test.ts
```

## Emulator UI

While emulator is running, open http://localhost:4000 to:
- View Firestore data in real-time
- Inspect documents and collections
- Debug test failures
- Clear test data

## File Locations

```
src/tests/integration/
├── setup.integration.ts                           # Test setup
├── firebase-emulator-utils.ts                     # Utilities
├── firestore-realtime.integration.test.ts         # ✅ 8 passing
├── firestore-data-consistency.integration.test.ts # ✅ 12 passing
└── trading-rate-limit-firestore.integration.test.ts # ⚠️ requires refactoring

docs/
└── FIREBASE_EMULATOR_TESTING.md                   # Full documentation

Root:
├── firebase.json                                  # Emulator config
├── .firebaserc                                    # Project config
├── firestore-test.rules                           # Test security rules
└── vitest.integration.config.ts                   # Test config
```

## Troubleshooting

### Emulator Won't Start

```bash
# Check if port 8080 is in use
lsof -i :8080

# Kill the process if needed
kill -9 <PID>
```

### Tests Timeout

- Ensure emulator is running (`npm run emulator:start`)
- Check emulator is on port 8080: `curl http://127.0.0.1:8080`
- Increase timeout in `vitest.integration.config.ts` if needed

### Tests Fail with "Permission Denied"

- Verify `firebase.json` uses `firestore-test.rules`
- Restart emulator after config changes
- Test rules should allow all operations

### Integration Tests Run During Regular Tests

- They shouldn't! Check `vitest.config.ts` excludes them
- Run `npm test` - should see 220 tests, not 249
- Integration tests only run with `npm run test:integration`

## Best Practices

1. **Always start emulator first** before running integration tests
2. **Use watch mode** during development (`npm run test:integration:watch`)
3. **Check emulator UI** when debugging test failures
4. **Don't commit emulator data** (it's in .gitignore)
5. **Keep tests isolated** - each test should work independently

## What's NOT Tested (Yet)

- Firebase Authentication (Auth emulator not configured)
- Firebase Storage (Storage emulator not configured)
- Cloud Functions (Functions emulator not configured)
- Security rules validation (using permissive test rules)

## Next Steps

1. **Read Full Documentation**: See `docs/FIREBASE_EMULATOR_TESTING.md`
2. **View Implementation Summary**: See `FIREBASE_EMULATOR_INTEGRATION_SUMMARY.md`
3. **Write New Tests**: Follow patterns in existing test files
4. **Refactor Middleware**: Enable trading rate limit tests (future work)

## Support

For issues or questions:
1. Check `docs/FIREBASE_EMULATOR_TESTING.md` troubleshooting section
2. View emulator logs: `tail -f firestore-debug.log`
3. Check Firebase Emulator docs: https://firebase.google.com/docs/emulator-suite

---

**Remember:** These tests use a local emulator. They never touch production Firebase! 🎉
