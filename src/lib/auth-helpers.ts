/**
 * Shared Auth & Role-Based Access Control (RBAC) Helpers
 */

export const DEFAULT_ADMIN_EMAILS = [
  'kartiksharma20081186@gmail.com',
];

/**
 * Returns a normalized list of admin/owner email addresses from environment or defaults.
 */
export function getAdminEmails(): string[] {
  const envEmails =
    process.env.ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    '';

  const list = envEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Combine with default admin emails, removing duplicates
  const all = Array.from(new Set([...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...list]));
  return all;
}

/**
 * Checks whether an email or assigned role qualifies as an Admin or Owner.
 */
export function isUserAdminOrOwner(
  email?: string | null,
  role?: string | null
): boolean {
  if (role === 'admin' || role === 'owner') {
    return true;
  }

  if (email) {
    const adminEmails = getAdminEmails();
    if (adminEmails.includes(email.trim().toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Derives the effective display role ('owner', 'admin', or 'user') for a given user.
 */
export function getEffectiveRole(
  email?: string | null,
  databaseRole?: string | null
): 'owner' | 'admin' | 'user' {
  if (databaseRole === 'owner') return 'owner';
  if (databaseRole === 'admin') return 'admin';

  if (email) {
    const adminEmails = getAdminEmails();
    if (adminEmails.includes(email.trim().toLowerCase())) {
      return 'owner';
    }
  }

  return 'user';
}
