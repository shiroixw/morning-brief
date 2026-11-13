/**
 * Allow same-site browser POSTs. Reject obvious cross-origin probes.
 * Missing Origin is allowed when Host matches (e.g. some same-origin cases).
 */
export function isAllowedOrigin(request: Request, siteUrl: string | undefined): boolean {
  let allowedOrigins: string[] = [];
  if (siteUrl) {
    try {
      allowedOrigins.push(new URL(siteUrl).origin);
    } catch {
      /* ignore bad site */
    }
  }

  const host = request.headers.get('host');
  if (host) {
    allowedOrigins.push(`https://${host}`);
    allowedOrigins.push(`http://${host}`);
  }

  // Local / preview hosts commonly used in Astro + Vercel
  allowedOrigins.push('http://localhost:4321', 'http://127.0.0.1:4321');

  const origin = request.headers.get('origin');
  if (!origin) {
    // Non-browser clients or same-origin navigations without Origin
    return Boolean(host);
  }

  try {
    const originUrl = new URL(origin);
    return allowedOrigins.some((allowed) => {
      try {
        return new URL(allowed).origin === originUrl.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

export function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}
