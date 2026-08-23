import { cookies } from 'next/headers';

export interface Session {
  id: string;
  name: string;
  role: 'user' | 'technician';
}

export const SESSION_COOKIE = 'fixmatch_session';

/**
 * DEMO AUTH ONLY. There's no password — logging in just creates/looks up a
 * User by name+role and stores it in a plain (non-httpOnly-signed) cookie.
 * This is deliberately minimal so the prototype runs without any auth
 * provider setup. Swap this whole file for Clerk (which you already use)
 * before this goes anywhere near real users — see README "What to extend".
 */
export function getSession(): Session | null {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}
