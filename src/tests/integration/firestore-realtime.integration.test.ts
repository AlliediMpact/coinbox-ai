/**
 * Firestore Real-time Listener Integration Tests
 * Tests onSnapshot behavior with Firebase Emulator
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { 
  onSnapshot, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import {
  initializeTestApp,
  cleanupTestEnvironment,
  clearFirestoreData,
  createTestDocument,
  waitFor,
} from './firebase-emulator-utils';

describe('Firestore Real-time Listeners Integration Tests', () => {
  let db: any;
  let unsubscribes: Unsubscribe[] = [];

  beforeAll(() => {
    const { db: testDb } = initializeTestApp();
    db = testDb;
  });

  afterAll(async () => {
    // Clean up all subscriptions
    unsubscribes.forEach(unsub => unsub());
    await cleanupTestEnvironment();
  });

  beforeEach(async () => {
    // Clean up subscriptions from previous test
    unsubscribes.forEach(unsub => unsub());
    unsubscribes = [];
    // Clear data before each test
    await clearFirestoreData(db);
  });

  it('should receive initial snapshot on listener attachment', async () => {
    // Arrange: Create test data
    await createTestDocument(db, 'tickets', 'ticket1', {
      userId: 'user1',
      type: 'Buy',
      status: 'Open',
      amount: 1000,
    });

    let snapshotReceived = false;
    let ticketData: any = null;

    // Act: Attach listener
    const unsub = onSnapshot(doc(db, 'tickets', 'ticket1'), (snapshot) => {
      snapshotReceived = true;
      ticketData = snapshot.data();
    });
    unsubscribes.push(unsub);

    // Assert: Wait for snapshot
    await waitFor(() => snapshotReceived);
    expect(ticketData).toBeDefined();
    expect(ticketData.type).toBe('Buy');
    expect(ticketData.status).toBe('Open');
    expect(ticketData.amount).toBe(1000);
  });

  it('should receive updates when document changes', async () => {
    // Arrange: Create initial document
    await createTestDocument(db, 'tickets', 'ticket2', {
      userId: 'user2',
      type: 'Sell',
      status: 'Open',
      amount: 2000,
    });

    const snapshots: any[] = [];

    // Act: Attach listener
    const unsub = onSnapshot(doc(db, 'tickets', 'ticket2'), (snapshot) => {
      snapshots.push(snapshot.data());
    });
    unsubscribes.push(unsub);

    // Wait for initial snapshot
    await waitFor(() => snapshots.length > 0);

    // Update document
    await updateDoc(doc(db, 'tickets', 'ticket2'), {
      status: 'Matched',
      updatedAt: Timestamp.now(),
    });

    // Assert: Wait for update snapshot
    await waitFor(() => snapshots.length >= 2);
    expect(snapshots[0].status).toBe('Open');
    expect(snapshots[1].status).toBe('Matched');
  });

  it('should receive notifications on document deletion', async () => {
    // Arrange: Create document
    await createTestDocument(db, 'tickets', 'ticket3', {
      userId: 'user3',
      type: 'Buy',
      status: 'Open',
      amount: 500,
    });

    let deletionDetected = false;

    // Act: Attach listener
    const unsub = onSnapshot(doc(db, 'tickets', 'ticket3'), (snapshot) => {
      if (!snapshot.exists()) {
        deletionDetected = true;
      }
    });
    unsubscribes.push(unsub);

    // Wait for initial snapshot
    await new Promise(resolve => setTimeout(resolve, 500));

    // Delete document
    await deleteDoc(doc(db, 'tickets', 'ticket3'));

    // Assert: Wait for deletion notification
    await waitFor(() => deletionDetected);
    expect(deletionDetected).toBe(true);
  });

  it('should support query-based listeners with filters', async () => {
    // Arrange: Create multiple documents
    await createTestDocument(db, 'tickets', 'ticket4', {
      userId: 'user4',
      type: 'Buy',
      status: 'Open',
      amount: 1000,
    });

    await createTestDocument(db, 'tickets', 'ticket5', {
      userId: 'user4',
      type: 'Sell',
      status: 'Matched',
      amount: 2000,
    });

    await createTestDocument(db, 'tickets', 'ticket6', {
      userId: 'user5',
      type: 'Buy',
      status: 'Open',
      amount: 1500,
    });

    let openTickets: any[] = [];

    // Act: Attach query listener for open tickets
    const q = query(
      collection(db, 'tickets'),
      where('status', '==', 'Open')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      openTickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    unsubscribes.push(unsub);

    // Assert: Wait for initial query results
    await waitFor(() => openTickets.length > 0);
    expect(openTickets.length).toBe(2);
    expect(openTickets.every(t => t.status === 'Open')).toBe(true);
  });

  it('should detect additions to queried collection', async () => {
    // Arrange: Setup query listener
    const ticketSnapshots: any[] = [];
    
    const q = query(
      collection(db, 'tickets'),
      where('status', '==', 'Open')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ticketSnapshots.push(tickets);
    });
    unsubscribes.push(unsub);

    // Wait for initial empty snapshot
    await waitFor(() => ticketSnapshots.length > 0);
    const initialCount = ticketSnapshots[0].length;

    // Act: Add new document matching query
    await createTestDocument(db, 'tickets', 'ticket7', {
      userId: 'user6',
      type: 'Buy',
      status: 'Open',
      amount: 3000,
    });

    // Assert: Wait for update with new document
    await waitFor(() => ticketSnapshots.length >= 2);
    const latestSnapshot = ticketSnapshots[ticketSnapshots.length - 1];
    expect(latestSnapshot.length).toBe(initialCount + 1);
    expect(latestSnapshot.some((t: any) => t.id === 'ticket7')).toBe(true);
  });

  it('should handle multiple simultaneous listeners', async () => {
    // Arrange: Create document
    await createTestDocument(db, 'tickets', 'ticket8', {
      userId: 'user7',
      type: 'Buy',
      status: 'Open',
      amount: 1000,
    });

    let listener1Updates = 0;
    let listener2Updates = 0;

    // Act: Attach multiple listeners
    const unsub1 = onSnapshot(doc(db, 'tickets', 'ticket8'), () => {
      listener1Updates++;
    });
    unsubscribes.push(unsub1);

    const unsub2 = onSnapshot(doc(db, 'tickets', 'ticket8'), () => {
      listener2Updates++;
    });
    unsubscribes.push(unsub2);

    // Wait for initial snapshots
    await waitFor(() => listener1Updates > 0 && listener2Updates > 0);

    // Update document
    await updateDoc(doc(db, 'tickets', 'ticket8'), {
      status: 'Matched',
    });

    // Assert: Both listeners should receive updates
    await waitFor(() => listener1Updates >= 2 && listener2Updates >= 2);
    expect(listener1Updates).toBeGreaterThanOrEqual(2);
    expect(listener2Updates).toBeGreaterThanOrEqual(2);
  });

  it('should stop receiving updates after unsubscribe', async () => {
    // Arrange: Create document
    await createTestDocument(db, 'tickets', 'ticket9', {
      userId: 'user8',
      type: 'Sell',
      status: 'Open',
      amount: 1500,
    });

    let updateCount = 0;

    // Act: Attach and immediately unsubscribe
    const unsub = onSnapshot(doc(db, 'tickets', 'ticket9'), () => {
      updateCount++;
    });

    // Wait for initial snapshot
    await waitFor(() => updateCount > 0);
    const countAfterInitial = updateCount;

    // Unsubscribe
    unsub();

    // Update document after unsubscribe
    await updateDoc(doc(db, 'tickets', 'ticket9'), {
      status: 'Matched',
    });

    // Wait to ensure no more updates
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Assert: Should not receive updates after unsubscribe
    expect(updateCount).toBe(countAfterInitial);
  });

  it('should handle transaction monitoring use case', async () => {
    // Arrange: Simulate transaction monitoring scenario
    const monitoredTransactions: any[] = [];

    const q = query(
      collection(db, 'transactions'),
      where('status', '==', 'pending')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const transaction = { id: change.doc.id, ...change.doc.data() };
        if (change.type === 'added') {
          monitoredTransactions.push({ type: 'added', data: transaction });
        } else if (change.type === 'modified') {
          monitoredTransactions.push({ type: 'modified', data: transaction });
        }
      });
    });
    unsubscribes.push(unsub);

    // Wait for initial snapshot
    await new Promise(resolve => setTimeout(resolve, 500));

    // Act: Create transaction
    await createTestDocument(db, 'transactions', 'tx1', {
      userId: 'user9',
      amount: 5000,
      status: 'pending',
      type: 'trade',
    });

    await waitFor(() => monitoredTransactions.length > 0);

    // Update transaction
    await updateDoc(doc(db, 'transactions', 'tx1'), {
      status: 'completed',
      completedAt: Timestamp.now(),
    });

    // Assert: Verify monitoring detected both events
    await waitFor(() => monitoredTransactions.length >= 2);
    expect(monitoredTransactions[0].type).toBe('added');
    expect(monitoredTransactions[0].data.id).toBe('tx1');
  });
});
