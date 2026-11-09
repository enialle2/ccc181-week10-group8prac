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
  } catch (error) {
    // Show a friendly message to the user, and the details in the console
    console.log('[API ERROR] Cannot reach the server', error);
    throw new AuthError('network', NETWORK_MESSAGE);
  }
}

// Read the answer from the API (empty if there is none)
async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Log in
export async function login(email: string, password: string): Promise<LoginResult> {
  // The password is hidden in the log
  console.log('[API REQUEST] POST /sessions', { email, password: '********' });

  const response = await send('/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await readBody(response);

  if (response.ok && body) {
    const data = body as LoginResult;
    // The token is hidden in the log
    console.log('[API RESPONSE] status', response.status, {
      token: '[hidden]',
      user: data.user,
    });
    return data;
  }

  console.log('[API ERROR] status', response.status, body);
  if (response.status === 400 || response.status === 401) {
    throw new AuthError('invalid', 'Wrong email or password.');
  }
  throw new AuthError('server', SERVER_MESSAGE);
}

// Get the logged-in user
export async function getMe(token: string): Promise<User> {
  console.log('[API REQUEST] GET /users/me', { Authorization: 'Bearer [hidden]' });

  const response = await send('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await readBody(response);

  if (response.ok && body) {
    console.log('[API RESPONSE] status', response.status, body);
    return body as User;
  }

  console.log('[API ERROR] status', response.status, body);
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