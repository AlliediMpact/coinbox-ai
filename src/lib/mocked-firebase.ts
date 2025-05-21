/**
 * Mocked Firebase Module
 * 
 * This file provides mock implementations of Firebase Firestore functions
 * for development and testing purposes when there are import issues.
 */

export type DocumentReference = any;
export type Timestamp = any;
export type DocumentData = any;

export interface Transaction {
  get: (docRef: any) => Promise<any>;
  set: (docRef: any, data: any) => void;
  update: (docRef: any, data: any) => void;
}

export const serverTimestamp = () => new Date();
export const Timestamp = {
  now: () => ({ toDate: () => new Date() }),
  fromDate: (date: Date) => ({ toDate: () => date })
};

export const setDoc = async (docRef: any, data: any) => {
  console.log('Mock setDoc called with:', { docRef, data });
  return Promise.resolve();
};

export const updateDoc = async (docRef: any, data: any) => {
  console.log('Mock updateDoc called with:', { docRef, data });
  return Promise.resolve();
};

export const getDoc = async (docRef: any) => {
  console.log('Mock getDoc called with:', { docRef });
  return {
    exists: () => true,
    data: () => ({ balance: 1000 })
  };
};

export const addDoc = async (collectionRef: any, data: any) => {
  console.log('Mock addDoc called with:', { collectionRef, data });
  return { id: `mock_${Date.now()}` };
};

export const runTransaction = async <T>(db: any, callback: (transaction: Transaction) => Promise<T>): Promise<T> => {
  console.log('Mock runTransaction called');
  const mockTransaction: Transaction = {
    get: async (docRef: any) => ({
      exists: () => true,
      data: () => ({ balance: 1000 })
    }),
    set: (docRef: any, data: any) => { 
      console.log('Mock transaction.set called:', { docRef, data });
    },
    update: (docRef: any, data: any) => {
      console.log('Mock transaction.update called:', { docRef, data });
    }
  };
  
  return await callback(mockTransaction);
};

export const limit = (n: number) => ({ type: 'limit', value: n });
export const startAfter = (cursor: any) => ({ type: 'startAfter', cursor });
