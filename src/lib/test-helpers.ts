import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';

export async function setupTestData(userId: string) {
  const db = getFirestore();

  // Setup test wallet
  await setDoc(doc(db, "wallets", userId), {
    balance: 1000,
    lockedBalance: 0,
    lastUpdated: new Date().toISOString()
  });

  // Setup test transactions
  const transactionsRef = collection(db, "wallets", userId, "transactions");
  await setDoc(doc(transactionsRef, "test1"), {
    type: "Deposit",
    amount: 500,
    date: new Date().toISOString(),
    method: "Test",
    status: "completed"
  });

  // Setup test trading ticket
  await setDoc(doc(db, "tickets", "test1"), {
    userId,
    type: "Borrow",
    amount: 100,
    status: "Open",
    createdAt: new Date()
  });
}
