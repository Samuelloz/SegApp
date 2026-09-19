export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === 'production'
    ? '__Host-segapp_session'
    : 'segapp_session';

export const INVALID_SESSION_MESSAGE = 'La sesión no es válida o ha expirado.';
