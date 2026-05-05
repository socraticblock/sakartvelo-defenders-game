const ALLOWED_PREFIXES = ['/images/', '/assets/', '/audio/', '/models/', './assets/'];

function decodePath(value: string): string {
  let current = value;
  for (let i = 0; i < 2; i++) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }
  return current;
}

export function safeAssetPath(value: unknown): string {
  if (typeof value !== 'string') return '';
  const path = value.trim();
  const lower = path.toLowerCase();
  const decoded = decodePath(path);
  const decodedLower = decoded.toLowerCase();

  if (!path) return '';
  if (/[\u0000-\u001f\u007f]/.test(path) || /[\u0000-\u001f\u007f]/.test(decoded)) return '';
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('http:') ||
    lower.startsWith('https:') ||
    decodedLower.startsWith('javascript:') ||
    decodedLower.startsWith('data:') ||
    decodedLower.startsWith('http:') ||
    decodedLower.startsWith('https:') ||
    path.startsWith('//') ||
    decoded.startsWith('//') ||
    path.includes('../') ||
    path.includes('..\\') ||
    decoded.includes('../') ||
    decoded.includes('..\\') ||
    path.includes('\\') ||
    decoded.includes('\\')
  ) {
    return '';
  }

  return ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix)) ? path : '';
}
