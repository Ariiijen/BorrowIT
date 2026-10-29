import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "node:fs";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/activateUser.mjs user@example.com");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url)),
);
initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, {
  ...user.customClaims,
  role: "authenticated",
});

console.log(`Activated ${email} (${user.uid})`);
process.exit(0);
