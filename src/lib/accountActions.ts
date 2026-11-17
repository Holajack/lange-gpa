"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * Delete the caller's own sign-in (Clerk user), permanently.
 *
 * A Server Action so the Clerk secret key never leaves the server and so the
 * request is same-origin only (Next rejects cross-site action posts). It acts
 * on the session's own user id — there is no parameter to point it at anyone
 * else. Called last, after the account's data is already gone.
 */
export async function deleteClerkAccount(): Promise<{ ok: boolean }> {
  // keyless demo build: there is no sign-in to delete
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return { ok: true };
  const { userId } = await auth();
  if (!userId) return { ok: false };
  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
