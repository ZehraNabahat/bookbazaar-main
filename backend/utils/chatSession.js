/**
 * Chat sessions are scoped per logged-in user or per guest browser profile.
 * Session ids use prefixes so one user cannot read another user's history.
 */
export function buildSessionId(userId) {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  if (userId) {
    return `user_${userId}_${suffix}`;
  }
  return `guest_${suffix}`;
}

export function sessionBelongsToUser(sessionId, userId) {
  if (!sessionId || typeof sessionId !== 'string') return false;
  if (userId) {
    return sessionId.startsWith(`user_${userId}_`);
  }
  return sessionId.startsWith('guest_');
}

export function resolveSessionId(requestedSessionId, userId) {
  if (userId) {
    if (sessionBelongsToUser(requestedSessionId, userId)) {
      return requestedSessionId;
    }
    return buildSessionId(userId);
  }
  if (requestedSessionId?.startsWith('guest_')) {
    return requestedSessionId;
  }
  return buildSessionId(null);
}
