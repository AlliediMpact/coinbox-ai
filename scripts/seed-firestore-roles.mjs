// Use the compiled admin module or ts-node/ts-node/register if needed.
// In this workspace we can import the TypeScript file via ts-node/register, or
// use a dynamic import of the TS module compiled at runtime.
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { adminDb } = require("../src/lib/firebase-admin.ts");

// TODO: Paste the actual Firebase Auth UIDs for each test user here
const TEST_USERS = [
  {
    uid: "<SIo1ZN7iYsYDTYOroklY0OxMk9e2>",
    email: "user.investor@test.coinbox.local",
    fullName: "Test Investor",
    role: "user",
    membershipTier: "Basic",
    kycStatus: "verified",
    status: "active",
  },
  {
    uid: "<xEVWhswsnSbCArg9Lap8jyUlPMF3>",
    email: "user.newbasic@test.coinbox.local",
    fullName: "New Basic User",
    role: "user",
    membershipTier: "Basic",
    kycStatus: "none",
    status: "active",
  },
  {
    uid: "<toks7ZxeGSg2ZGCfbFjOBM6R2Zm1>",
    email: "admin.main@test.coinbox.local",
    fullName: "Main Admin",
    role: "admin",
    membershipTier: "Business",
    kycStatus: "verified",
    status: "active",
  },
  {
    uid: "<rsKJQtPP9NdDpRAUe3nsG6vXqJf2>",
    email: "support.agent@test.coinbox.local",
    fullName: "Support Agent",
    role: "support",
    membershipTier: "Ambassador",
    kycStatus: "verified",
    status: "active",
  },
  {
    uid: "<jHTVR895NYUToZMTq9NrnMipwq23>",
    email: "user.rejected@test.coinbox.local",
    fullName: "Rejected User",
    role: "user",
    membershipTier: "Basic",
    kycStatus: "rejected",
    status: "active",
  },
];

async function run() {
  if (!adminDb) {
    console.error("Firebase Admin SDK is not initialized. Check src/lib/firebase-admin.");
    process.exit(1);
  }

  console.log("Seeding Firestore user roles for test users...\n");

  for (const user of TEST_USERS) {
    if (!user.uid || user.uid.startsWith("<UID_")) {
      console.warn(
        `Skipping ${user.email} because UID placeholder has not been replaced.`,
      );
      continue;
    }

    const ref = adminDb.collection("users").doc(user.uid);

    const payload = {
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      membershipTier: user.membershipTier,
      emailVerified: true,
      kycStatus: user.kycStatus,
      status: user.status,
      updatedAt: new Date(),
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    await ref.set(payload, { merge: true });
    console.log(`✔ Set role '${user.role}' for ${user.email} (${user.uid})`);
  }

  console.log("\nDone. Verify the 'users' collection in Firestore.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Error seeding roles:", err);
  process.exit(1);
});
