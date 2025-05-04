import admin from "firebase-admin";

let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;

// This ensures the code only runs on the server
if (typeof window === 'undefined') {
  if (!admin.apps.length) {
    console.log("Attempting to initialize Firebase Admin SDK using GOOGLE_APPLICATION_CREDENTIALS...");

    const databaseURL = process.env.FIREBASE_DATABASE_URL;
    // GOOGLE_APPLICATION_CREDENTIALS should be set in your environment/`.env.local`
    const googleCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    console.log("Firebase Admin Config:");
    console.log(`  GOOGLE_APPLICATION_CREDENTIALS: ${googleCredentialsPath}`);
    console.log(`  databaseURL: ${databaseURL}`);

    if (!googleCredentialsPath) {
        console.error("Firebase Admin SDK initialization failed: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.");
         // You might want to throw an error here to prevent further execution
        // throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS");
    } else {
         try {
             // Initialize using GOOGLE_APPLICATION_CREDENTIALS environment variable
             // The Admin SDK will automatically load the service account file
            admin.initializeApp({
              credential: admin.credential.application(), // Use application default credentials
              databaseURL: databaseURL,
            });
             console.log("Firebase Admin SDK initialized successfully using GOOGLE_APPLICATION_CREDENTIALS.");
         } catch (error) {
             console.error("Firebase Admin SDK initialization error:", error);
              // Re-throw the error to surface it clearly during startup
             throw error;
         }
    }
  }

  if (admin.apps.length) {
     // Check if the app was successfully initialized before getting auth and db
     const defaultApp = admin.app(); // Get the default app instance
     if (defaultApp) {
        adminAuth = admin.auth(defaultApp);
        adminDb = admin.firestore(defaultApp);
         console.log("Firebase Admin auth and db instances obtained.");
     } else {
         console.error("Firebase Admin app not initialized, cannot get auth or db instances.");
     }
  } else {
       console.error("Firebase Admin app did not initialize.");
  }
}

export { adminAuth, adminDb };