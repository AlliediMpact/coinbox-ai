/**
 * Event types for auth logging
 */
export enum AuthEventType {
  SIGN_IN_SUCCESS = 'sign_in_success',
  SIGN_IN_FAILURE = 'sign_in_failure',
  SIGN_OUT = 'sign_out',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_COMPLETE = 'password_reset_complete',
  EMAIL_VERIFICATION_SENT = 'email_verification_sent',
  EMAIL_VERIFIED = 'email_verified',
  ACCOUNT_CREATED = 'account_created',
  ACCOUNT_DELETED = 'account_deleted',
  PASSWORD_CHANGED = 'password_changed',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_VERIFICATION_SUCCESS = 'mfa_verification_success',
  MFA_VERIFICATION_FAILURE = 'mfa_verification_failure',
  AUTH_TOKEN_REFRESH = 'auth_token_refresh',
  AUTH_ERROR = 'auth_error',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked'
}
