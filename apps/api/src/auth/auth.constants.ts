import { type CookieOptions } from 'express';

export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === 'production'
    ? '__Host-segapp_session'
    : 'segapp_session';

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
} satisfies CookieOptions;

export const INVALID_SESSION_MESSAGE = 'La sesión no es válida o ha expirado.';

export const INSUFFICIENT_PERMISSIONS_MESSAGE =
  'No tienes permisos para realizar esta acción.';
