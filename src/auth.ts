export function decodificarToken(token: string): { 'cognito:groups'?: string[]; email?: string; name?: string } {
  const payload = token.split('.')[1];
  return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
}