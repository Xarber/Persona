// SPDX-License-Identifier: AGPL-3.0-only
// Preferences only. Project documents and credentials never belong here.
const session = new Map<string, string>();
export const preferences = {
  getItem(key: string): string | null {
    if (session.has(key)) return session.get(key)!;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    session.set(key, value);
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Session-only fallback. */
    }
  },
};
