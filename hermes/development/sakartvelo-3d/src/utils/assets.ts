const ALLOWED_PREFIXES = ['/images/', '/assets/', '/audio/', '/models/', './assets/'];

export function safeAssetPath(value: unknown): string {
  if (typeof value !== 'string') return '';
  const path = value.trim();
  const lower = path.toLowerCase();

  if (!path) return '';
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('http:') ||
    lower.startsWith('https:') ||
    path.startsWith('//') ||
    path.includes('../') ||
    path.includes('..\\')
  ) {
    return '';
  }

  return ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix)) ? path : '';
}
