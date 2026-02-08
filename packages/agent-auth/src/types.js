/**
 * @module types
 * Shared types for ProofiAgent agent authentication.
 */

/** Permission levels for credential access */
export const PermissionLevel = {
  READ: 'read',
  PRESENT: 'present',
  DERIVE: 'derive',
};

/** Session status values */
export const SessionStatus = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
};
