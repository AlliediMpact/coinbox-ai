import { db } from './firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc,
  query, 
  where, 
  getDocs, 
  DocumentData, 
  QueryConstraint
} from 'firebase/firestore';

export class ServiceClient {
  protected async getDocument<T extends DocumentData>(path: string): Promise<T | null> {
    try {
      const snapshot = await getDoc(doc(db, path));
      return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as T : null;
    } catch (error) {
      console.error(`Error fetching document at ${path}:`, error);
      throw new Error('Failed to fetch document');
    }
  }

  protected async createDocument<T extends DocumentData>(
    collectionPath: string, 
    data: Omit<T, 'id'>
  ): Promise<T> {
    try {
      const collectionRef = collection(db, collectionPath);
      const docRef = await addDoc(collectionRef, {
        ...data,
        createdAt: data.createdAt || new Date(),
        updatedAt: new Date()
      });
      
      return { id: docRef.id, ...data } as T;
    } catch (error) {
      console.error(`Error creating document in ${collectionPath}:`, error);
      throw new Error('Failed to create document');
    }
  }

  protected async updateDocument(path: string, data: Partial<DocumentData>): Promise<void> {
    try {
      await updateDoc(doc(db, path), {
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error(`Error updating document at ${path}:`, error);
      throw new Error('Failed to update document');
    }
  }

  protected async queryCollection<T extends DocumentData>(
    collectionPath: string,
    constraints: QueryConstraint[]
  ): Promise<T[]> {
    try {
      const q = query(collection(db, collectionPath), ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (error) {
      console.error(`Error querying collection ${collectionPath}:`, error);
      throw new Error('Failed to query collection');
    }
  }
}
