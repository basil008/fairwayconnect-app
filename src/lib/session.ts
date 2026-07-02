/**
 * Signed session tokens (HMAC-SHA256) using Web Crypto.
 * Works in both Node.js route handlers and the Edge middleware runtime.
 *
 * Token format: base64url(JSON payload) + "." + base64url(HMAC signature)
 *
 * SECURITY: Set SESSION_SECRET in production (fly secrets set SESSION_SECRET=...).
 * Without it, a random per-process secret is used — sessions won't survive
 * restarts and won't work across multiple machines.
 */

export const SESSION_COOKIE = 'fc_session';

export interface SessionPayload {
  role: 'admin' | 'member';
  memberId?: string;
  name?: string;
  exp: number; // unix seconds
}

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;

  // Middleware (edge runtime) and route handlers (Node runtime) are separate
  // module instances, so the fallback MUST be deterministic or tokens signed
  // in one runtime won't verify in the other.
  if (process.env.NODE_ENV === 'production') {
    // Fail loudly rather than run production auth on a known constant.
    throw new Error(
      'SESSION_SECRET is required in production. Set it with: ' +
      'fly secrets set SESSION_SECRET=$(openssl rand -hex 32)'
    );
  }
  return 'fairwayconnect-dev-only-secret-do-not-use-in-production';
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (s.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function createSessionToken(
  payload: Omit<SessionPayload, 'exp'>,
  maxAgeSeconds: number
): Promise<string> {
  const full: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const body = b64url(encoder.encode(JSON.stringify(full)));
  const key = await getKey();
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return `${body}.${b64url(sig)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const key = await getKey();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sig) as unknown as BufferSource,
      encoder.encode(body)
    );
    if (!valid) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(b64urlDecode(body))
    ) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.role !== 'admin' && payload.role !== 'member') return null;
    return payload;
  } catch {
    return null;
  }
}

/** Extract and verify the session from a Request's Cookie header. */
export async function getSessionFromRequest(req: Request): Promise<SessionPayload | null> {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return verifySessionToken(match?.[1] ? decodeURIComponent(match[1]) : null);
}

export const ADMIN_SESSION_MAX_AGE = 8 * 60 * 60;        // 8 hours
export const MEMBER_SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export function sessionCookieHeader(token: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
