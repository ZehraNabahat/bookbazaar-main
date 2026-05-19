const STORAGE_KEY = 'bookbazaar_chat_sessions';

type SessionMap = Record<string, string>;

function storageKey(userId: string | null | undefined): string {
  return userId ? `user_${userId}` : 'guest';
}

function readMap(): SessionMap {
  if (typeof window === 'undefined') return {};
  try {
    if (localStorage.getItem('chatSessionId')) {
      localStorage.removeItem('chatSessionId');
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeMap(map: SessionMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getChatSessionId(userId: string | null | undefined): string {
  const key = storageKey(userId);
  const map = readMap();
  if (!map[key]) {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    map[key] = userId ? `user_${userId}_${suffix}` : `guest_${suffix}`;
    writeMap(map);
  }
  return map[key];
}

/** New conversation for the current user/guest (e.g. after logout or "clear chat") */
export function rotateChatSession(userId: string | null | undefined): string {
  const key = storageKey(userId);
  const map = readMap();
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  map[key] = userId ? `user_${userId}_${suffix}` : `guest_${suffix}`;
  writeMap(map);
  return map[key];
}

export function clearGuestSessions() {
  const map = readMap();
  delete map.guest;
  writeMap(map);
}
