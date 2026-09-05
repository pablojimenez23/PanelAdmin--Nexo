const COGNITO_DOMAIN = 'https://us-east-1zokcvbrhg.auth.us-east-1.amazoncognito.com';
const CLIENT_ID = '3f6ndcnegj9ufuurqhet3soeme';
const REDIRECT_URI = 'http://localhost:5173';

function base64UrlEncode(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateRandomString(length = 64) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64UrlEncode(array.buffer).slice(0, length);
}

async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashed = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(hashed);
}

export async function iniciarLoginGoogle() {
  const verifier = generateRandomString();
  const challenge = await generateCodeChallenge(verifier);
  sessionStorage.setItem('pkce_verifier', verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: REDIRECT_URI,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    identity_provider: 'Google',
  });

  window.location.href = `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
}

export async function intercambiarCodigoPorToken(code: string): Promise<string | null> {
  const verifier = sessionStorage.getItem('pkce_verifier');
  if (!verifier) return null;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });

  const res = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token as string;
}

export function decodificarToken(token: string): { 'cognito:groups'?: string[]; email?: string; name?: string } {
  const payload = token.split('.')[1];
  return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
}