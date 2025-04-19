declare module 'firebase/firestore' {
    export interface DocumentData {
        [key: string]: any;
    }

    export interface QueryDocumentSnapshot<T = DocumentData> {
        id: string;
        data(): T;
        exists(): boolean;
    }

    export interface Transaction {
        get(ref: any): Promise<QueryDocumentSnapshot>;
        set(ref: any, data: any): Transaction;
        update(ref: any, data: any): Transaction;
        delete(ref: any): Transaction;
    }

    export interface FirestoreDataConverter<T> {
        toFirestore(modelObject: T): DocumentData;
        fromFirestore(snapshot: QueryDocumentSnapshot<DocumentData>): T;
    }

    export function getFirestore(app?: any): any;
    export function doc(firestore: any, path: string, ...pathSegments: string[]): any;
    export function collection(firestore: any, path: string, ...pathSegments: string[]): any;
    export function query(collection: any, ...queryConstraints: any[]): any;
    export function where(fieldPath: string, opStr: string, value: any): any;
    export function orderBy(fieldPath: string, directionStr?: 'desc' | 'asc'): any;
    export function getDocs(query: any): Promise<{ docs: QueryDocumentSnapshot[] }>;
    export function runTransaction<T>(db: any, updateFunction: (transaction: Transaction) => Promise<T>): Promise<T>;
}