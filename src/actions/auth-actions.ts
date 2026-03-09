'use server';

/**
 * Server Action: Validates an access code against server-side environment variables.
 * Codes are never sent to the client — this is the secure gate for all signups.
 */
export async function validateAccessCodeAction(
  code: string,
  emailType: 'org' | 'personal'
): Promise<{ valid: boolean; role: 'staff' | 'volunteer' }> {
  const staffCode = process.env.STAFF_ACCESS_CODE;
  const volunteerCode = process.env.VOLUNTEER_ACCESS_CODE;

  if (!staffCode || !volunteerCode) {
    console.error('[AUTH] Access code env vars are not set. Check STAFF_ACCESS_CODE and VOLUNTEER_ACCESS_CODE.');
    return { valid: false, role: 'volunteer' };
  }

  if (emailType === 'org') {
    // Org emails use the staff code
    return { valid: code === staffCode, role: 'staff' };
  }

  // Personal emails can use either the volunteer or staff code
  if (code === volunteerCode) return { valid: true, role: 'volunteer' };
  if (code === staffCode) return { valid: true, role: 'staff' };

  return { valid: false, role: 'volunteer' };
}
