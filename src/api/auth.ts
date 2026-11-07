// Functions that talk to the CampusConnect API (contract: Section 11).
// Components call these instead of calling fetch directly.

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

export type AuthErrorKind = 'invalid' | 'unauthorized' | 'network' | 'server';

export class AuthError extends Error {
  kind: AuthErrorKind;

  constructor(kind: AuthErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

const API_URL = import.meta.env.VITE_API_URL as string;
const TOKEN_KEY = 'campusconnect_token';

const NETWORK_MESSAGE = 'Cannot reach the server. Please try again.';
const SERVER_MESSAGE = 'Something went wrong on our side. Please try again later.';

async function send(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, init);
  } catch {
    // Server stopped or wrong address: never show the raw "Failed to fetch".
    throw new AuthError('network', NETWORK_MESSAGE);
  }
}

// POST /sessions
export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await send('/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (response.ok) {
    return (await response.json()) as LoginResult;
  }
  if (response.status === 400 || response.status === 401) {
    throw new AuthError('invalid', 'Wrong email or password.');
  }
  throw new AuthError('server', SERVER_MESSAGE);
}

// GET /users/me (needs the token)
export async function getMe(token: string): Promise<User> {
  const response = await send('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok) {
    return (await response.json()) as User;
  }
  if (response.status === 401) {
    throw new AuthError('unauthorized', 'Not logged in.');
  }
  throw new AuthError('server', SERVER_MESSAGE);
}

// Token helpers (sessionStorage only; never log the token or put it in a URL)
export function saveToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function readToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}