/**
 * Firestore Data Consistency Integration Tests
 * Tests data sync behavior and consistency with Firebase Emulator
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  runTransaction,
  Timestamp,
  increment,
} from 'firebase/firestore';
import {
  initializeTestApp,
  cleanupTestEnvironment,
  clearFirestoreData,
  createTestDocument,
  getDocumentData,
  documentExists,
} from './firebase-emulator-utils';

describe('Firestore Data Consistency Integration Tests', () => {
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

  describe('Basic CRUD Consistency', () => {
    it('should maintain consistency for create and read operations', async () => {
      // Arrange & Act
      const ticketData = {
        userId: 'user1',
        type: 'Buy',
        status: 'Open',
        amount: 1000,
        cryptocurrency: 'BTC',
      };

      await createTestDocument(db, 'tickets', 'ticket1', ticketData);

      // Assert
      const exists = await documentExists(db, 'tickets', 'ticket1');
      expect(exists).toBe(true);

      const retrieved = await getDocumentData(db, 'tickets', 'ticket1');
      expect(retrieved.userId).toBe(ticketData.userId);
      expect(retrieved.type).toBe(ticketData.type);
      expect(retrieved.amount).toBe(ticketData.amount);
    });

    it('should maintain consistency for update operations', async () => {
      // Arrange
      await createTestDocument(db, 'tickets', 'ticket2', {
        userId: 'user2',
        status: 'Open',
        amount: 2000,
      });

      // Act
      await updateDoc(doc(db, 'tickets', 'ticket2'), {
        status: 'Matched',
        matchedWith: 'ticket3',
        updatedAt: Timestamp.now(),
      });

      // Assert
      const updated = await getDocumentData(db, 'tickets', 'ticket2');
      expect(updated.status).toBe('Matched');
      expect(updated.matchedWith).toBe('ticket3');
      expect(updated.amount).toBe(2000); // Unchanged field
    });

    it('should maintain consistency for delete operations', async () => {
      // Arrange
      await createTestDocument(db, 'tickets', 'ticket3', {
        userId: 'user3',
        status: 'Cancelled',
      });

      const existsBefore = await documentExists(db, 'tickets', 'ticket3');
      expect(existsBefore).toBe(true);

      // Act
      await deleteDoc(doc(db, 'tickets', 'ticket3'));

      // Assert
      const existsAfter = await documentExists(db, 'tickets', 'ticket3');
      expect(existsAfter).toBe(false);
    });
  });

  describe('Batch Write Consistency', () => {
    it('should maintain consistency for batch writes', async () => {
      // Arrange
      const batch = writeBatch(db);

      // Act: Batch multiple operations
      batch.set(doc(db, 'tickets', 'batch1'), {
        userId: 'user4',
        type: 'Buy',
        amount: 1000,
        createdAt: Timestamp.now(),
      });

      batch.set(doc(db, 'tickets', 'batch2'), {
        userId: 'user5',
        type: 'Sell',
        amount: 1500,
        createdAt: Timestamp.now(),
      });

      batch.set(doc(db, 'transactions', 'tx1'), {
        buyTicket: 'batch1',
        sellTicket: 'batch2',
        amount: 1000,
        status: 'completed',
        createdAt: Timestamp.now(),
      });

      await batch.commit();

      // Assert: All documents should exist
      const ticket1Exists = await documentExists(db, 'tickets', 'batch1');
      const ticket2Exists = await documentExists(db, 'tickets', 'batch2');
      const txExists = await documentExists(db, 'transactions', 'tx1');

      expect(ticket1Exists).toBe(true);
      expect(ticket2Exists).toBe(true);
      expect(txExists).toBe(true);
    });

    it('should rollback entire batch on failure', async () => {
      // Arrange: Create a document
      await createTestDocument(db, 'tickets', 'existing', {
        userId: 'user6',
        amount: 500,
      });

      const batch = writeBatch(db);

      batch.set(doc(db, 'tickets', 'new1'), {
        userId: 'user7',
        amount: 1000,
        createdAt: Timestamp.now(),
      });

      // This should fail because we're trying to create a document that already exists
      // Note: In Firestore, set() doesn't fail on existing docs, so we simulate with update
      batch.update(doc(db, 'tickets', 'nonexistent'), {
        status: 'updated',
      });

      // Act & Assert: Batch should fail
      await expect(batch.commit()).rejects.toThrow();

      // Verify rollback: new1 should not exist
      const new1Exists = await documentExists(db, 'tickets', 'new1');
      expect(new1Exists).toBe(false);
    });
  });

  describe('Transaction Consistency', () => {
    it('should maintain consistency within transactions', async () => {
      // Arrange: Create account documents
      await createTestDocument(db, 'accounts', 'account1', {
        userId: 'user8',
        balance: 10000,
      });

      await createTestDocument(db, 'accounts', 'account2', {
        userId: 'user9',
        balance: 5000,
      });

      // Act: Transfer funds atomically
      await runTransaction(db, async (transaction) => {
        const account1Ref = doc(db, 'accounts', 'account1');
        const account2Ref = doc(db, 'accounts', 'account2');

        const account1Doc = await transaction.get(account1Ref);
        const account2Doc = await transaction.get(account2Ref);

        const transferAmount = 2000;

        transaction.update(account1Ref, {
          balance: account1Doc.data()!.balance - transferAmount,
        });

        transaction.update(account2Ref, {
          balance: account2Doc.data()!.balance + transferAmount,
        });
      });

      // Assert: Balances should be updated correctly
      const account1Data = await getDocumentData(db, 'accounts', 'account1');
      const account2Data = await getDocumentData(db, 'accounts', 'account2');

      expect(account1Data.balance).toBe(8000);
      expect(account2Data.balance).toBe(7000);
    });

    it('should rollback transaction on failure', async () => {
      // Arrange
      await createTestDocument(db, 'accounts', 'account3', {
        userId: 'user10',
        balance: 5000,
      });

      const initialBalance = 5000;

      // Act & Assert: Transaction with intentional failure
      await expect(
        runTransaction(db, async (transaction) => {
          const accountRef = doc(db, 'accounts', 'account3');
          const accountDoc = await transaction.get(accountRef);

          transaction.update(accountRef, {
            balance: accountDoc.data()!.balance - 1000,
          });

          // Simulate failure
          throw new Error('Transaction failed');
        })
      ).rejects.toThrow('Transaction failed');

      // Verify rollback
      const accountData = await getDocumentData(db, 'accounts', 'account3');
      expect(accountData.balance).toBe(initialBalance);
    });
  });

  describe('Query Consistency', () => {
    it('should return consistent query results', async () => {
      // Arrange: Create multiple tickets
      await createTestDocument(db, 'tickets', 'q1', {
        userId: 'user11',
        status: 'Open',
        amount: 1000,
      });

      await createTestDocument(db, 'tickets', 'q2', {
        userId: 'user11',
        status: 'Matched',
        amount: 2000,
      });

      await createTestDocument(db, 'tickets', 'q3', {
        userId: 'user12',
        status: 'Open',
        amount: 1500,
      });

      // Act: Query for user11's tickets
      const q = query(
        collection(db, 'tickets'),
        where('userId', '==', 'user11')
      );

      const snapshot = await getDocs(q);
      const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Assert
      expect(tickets.length).toBe(2);
      expect(tickets.every((t: any) => t.userId === 'user11')).toBe(true);
    });

    it('should reflect immediate updates in subsequent queries', async () => {
      // Arrange
      await createTestDocument(db, 'tickets', 'q4', {
        userId: 'user13',
        status: 'Open',
        amount: 3000,
      });

      // Act: Update and query
      await updateDoc(doc(db, 'tickets', 'q4'), {
        status: 'Matched',
      });

      const q = query(
        collection(db, 'tickets'),
        where('status', '==', 'Matched')
      );

      const snapshot = await getDocs(q);
      const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Assert
      expect(tickets.some((t: any) => t.id === 'q4')).toBe(true);
    });
  });

  describe('Concurrent Operations Consistency', () => {
    it('should handle concurrent writes to different documents', async () => {
      // Act: Concurrent writes
      await Promise.all([
        createTestDocument(db, 'tickets', 'concurrent1', {
          userId: 'user14',
          amount: 1000,
        }),
        createTestDocument(db, 'tickets', 'concurrent2', {
          userId: 'user15',
          amount: 2000,
        }),
        createTestDocument(db, 'tickets', 'concurrent3', {
          userId: 'user16',
          amount: 3000,
        }),
      ]);

      // Assert: All documents should exist
      const exists1 = await documentExists(db, 'tickets', 'concurrent1');
      const exists2 = await documentExists(db, 'tickets', 'concurrent2');
      const exists3 = await documentExists(db, 'tickets', 'concurrent3');

      expect(exists1 && exists2 && exists3).toBe(true);
    });

    it('should handle concurrent updates with increment', async () => {
      // Arrange
      await setDoc(doc(db, 'counters', 'counter1'), {
        value: 0,
      });

      // Act: Concurrent increments
      await Promise.all([
        updateDoc(doc(db, 'counters', 'counter1'), {
          value: increment(1),
        }),
        updateDoc(doc(db, 'counters', 'counter1'), {
          value: increment(1),
        }),
        updateDoc(doc(db, 'counters', 'counter1'), {
          value: increment(1),
        }),
      ]);

      // Assert: Counter should be 3
      const counterData = await getDocumentData(db, 'counters', 'counter1');
      expect(counterData.value).toBe(3);
    });
  });

  describe('Timestamp Consistency', () => {
    it('should maintain timestamp ordering', async () => {
      // Act: Create documents sequentially
      await createTestDocument(db, 'events', 'event1', {
        name: 'First',
        timestamp: Timestamp.now(),
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      await createTestDocument(db, 'events', 'event2', {
        name: 'Second',
        timestamp: Timestamp.now(),
      });

      // Assert: Timestamps should be ordered
      const event1 = await getDocumentData(db, 'events', 'event1');
      const event2 = await getDocumentData(db, 'events', 'event2');

      expect(event1.timestamp.toMillis()).toBeLessThan(
        event2.timestamp.toMillis()
      );
    });
  });
});
