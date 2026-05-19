/** Cookie settings for JWT auth (supports cross-origin frontend on Railway). */
export const getAuthCookieOptions = (overrides = {}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL || '';
  const crossOrigin =
    isProduction &&
    frontendUrl &&
    !frontendUrl.includes('localhost') &&
    !frontendUrl.includes('127.0.0.1');

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? (crossOrigin ? 'none' : 'strict') : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    ...overrides,
  };
};
