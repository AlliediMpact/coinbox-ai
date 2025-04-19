import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';

let app: App;

export function initAdmin() {
    if (getApps().length === 0) {
        app = initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
        });
    } else {
        app = getApp();
    }
    return app;
}