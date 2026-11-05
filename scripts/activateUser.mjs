import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "node:fs";

const email = process.argv[2];
const allUsers = email === "--all";
if (!email) {
  console.error("Usage: node scripts/activateUser.mjs [user@example.com|--all]");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url)),
);
initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();

async function setAuthenticatedClaim(user) {
  await auth.setCustomUserClaims(user.uid, {
    ...user.customClaims,
    role: "authenticated",
  });
}

if (allUsers) {
  let nextPageToken;
  let count = 0;
  do {
    const page = await auth.listUsers(1000, nextPageToken);
    for (const user of page.users) {
      await setAuthenticatedClaim(user);
      count += 1;
    }
    nextPageToken = page.pageToken;
  } while (nextPageToken);

  console.log(`Set authenticated claims for ${count} Firebase users.`);
  process.exit(0);
}

const user = await auth.getUserByEmail(email);
await setAuthenticatedClaim(user);

console.log(`Activated ${email} (${user.uid})`);
process.exit(0);
