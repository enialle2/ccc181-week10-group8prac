// Functions that talk to the API

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
    // Show a friendly message
    console.log('[API ERROR] Cannot reach the server');
    throw new AuthError('network', NETWORK_MESSAGE);
  }
}

// Log in
export async function login(email: string, password: string): Promise<LoginResult> {
  console.log('[API REQUEST] POST /sessions', { email, password: '********' });

  const response = await send('/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  console.log('[API RESPONSE] status', response.status);

  if (response.ok) {
    const data = (await response.json()) as LoginResult;
    console.log('[API RESPONSE] user', data.user); // token is not shown
    return data;
  }
  if (response.status === 400 || response.status === 401) {
    console.log('[API ERROR] Invalid email or password.');
    throw new AuthError('invalid', 'Wrong email or password.');
  }
  console.log('[API ERROR] Server problem');
  throw new AuthError('server', SERVER_MESSAGE);
}

// Get the logged-in user
export async function getMe(token: string): Promise<User> {
  console.log('[API REQUEST] GET /users/me');

  const response = await send('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('[API RESPONSE] status', response.status);

  if (response.ok) {
    return (await response.json()) as User;
  }
  if (response.status === 401) {
    throw new AuthError('unauthorized', 'Not logged in.');
  }
  throw new AuthError('server', SERVER_MESSAGE);
}

// Save, read, and remove the token
export function saveToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function readToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}