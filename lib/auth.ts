/**
 * Authentication utilities
 * Helpers for getting current user session and auth checks
 */

import { createClient } from "./supabase/server";
import type { AuthUser, AuthSession } from "./types";

/**
 * Get current authenticated user session
 * @throws Error if no user is authenticated
 * @returns AuthSession with user info
 */
export async function getSession(): Promise<AuthSession> {
  const client = await createClient();
  const {
    data: { session },
  } = await client.auth.getSession();

  if (!session) {
    throw new Error("No authenticated session found");
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      userMetadata: session.user.user_metadata,
    },
  };
}

/**
 * Get current user safely (returns null if not authenticated)
 * @returns AuthUser | null
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const session = await getSession();
    return session.user;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 * @returns boolean
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * Assert that user is authenticated, throw if not
 * Useful in protected API routes
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
