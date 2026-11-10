/** Stable auth error codes — map via i18n in screens / toUserError. */
export const AUTH_EMAIL_CONFIRM_REQUIRED = 'EMAIL_CONFIRM_REQUIRED';

export function isEmailConfirmRequiredError(error: unknown) {
  return error instanceof Error && error.message === AUTH_EMAIL_CONFIRM_REQUIRED;
}
