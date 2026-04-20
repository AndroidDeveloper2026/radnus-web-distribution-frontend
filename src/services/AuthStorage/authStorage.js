// src/services/AuthStorage/authStorage.js
// Web equivalent of mobile's AsyncStorage-based authStorgage.js

const ACCESS_TOKEN  = 'accessToken';
const REFRESH_TOKEN = 'refreshToken';
const USER_DATA_KEY = 'user_data';
const SESSION_KEY   = 'sessionId';

// ─── Token Management ────────────────────────────────────────────────────────

export const setTokens = (access, refresh) => {
  localStorage.setItem(ACCESS_TOKEN,  access);
  localStorage.setItem(REFRESH_TOKEN, refresh);
};

export const getAccessToken  = () => localStorage.getItem(ACCESS_TOKEN);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN);

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
};

// ─── User Data ───────────────────────────────────────────────────────────────

export const setUserData = (user) =>
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));

export const getUserData = () => {
  try {
    const raw = localStorage.getItem(USER_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearUserData = () => localStorage.removeItem(USER_DATA_KEY);

// ─── Session ─────────────────────────────────────────────────────────────────

export const setSessionId = (id) => localStorage.setItem(SESSION_KEY, id);
export const getSessionId = ()    => localStorage.getItem(SESSION_KEY);
export const clearSessionId = ()  => localStorage.removeItem(SESSION_KEY);

// ─── Clear All ───────────────────────────────────────────────────────────────

export const clearAll = () => {
  clearTokens();
  clearUserData();
  clearSessionId();
};
