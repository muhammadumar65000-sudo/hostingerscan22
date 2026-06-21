import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Serve built static files
app.use(express.static(join(__dirname, 'dist/public')));

// API: IP info — proxied from ipapi.co server-side (no CORS issues)
app.get('/api/ipinfo', async (req, res) => {
  try {
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp = (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : '') || req.ip || '';

    const url = clientIp && !isLocalIp(clientIp)
      ? `https://ipapi.co/${encodeURIComponent(clientIp)}/json/`
      : `https://ipapi.co/json/`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'PhoneDetect/1.0' },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) throw new Error('ipapi failed');
    const data = await response.json();
    if (data.error) throw new Error(data.reason || 'ipapi error');

    res.json({
      ip: data.ip || clientIp || 'unknown',
      city: data.city || null,
      region: data.region || null,
      country: data.country_name || null,
      countryCode: data.country_code || null,
      postal: data.postal || null,
      latitude: typeof data.latitude === 'number' ? data.latitude : null,
      longitude: typeof data.longitude === 'number' ? data.longitude : null,
      timezone: data.timezone || null,
      isp: data.org || null,
      org: data.org || null,
      asn: data.asn || null,
      source: 'ipapi',
    });
  } catch {
    res.json({
      ip: req.ip || 'unknown',
      city: null, region: null, country: null, countryCode: null,
      postal: null, latitude: null, longitude: null, timezone: null,
      isp: null, org: null, asn: null, source: 'error',
    });
  }
});

// SPA fallback — all routes serve index.html
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist/public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PhoneDetect server running on port ${PORT}`);
});

function isLocalIp(ip) {
  if (!ip) return true;
  return (
    ip === '::1' || ip === '127.0.0.1' ||
    ip.startsWith('10.') || ip.startsWith('192.168.') ||
    ip.startsWith('172.16.') || ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') || ip.startsWith('172.19.') ||
    ip.startsWith('172.2') || ip.startsWith('172.30.') ||
    ip.startsWith('172.31.') || ip.startsWith('fc00:') ||
    ip.startsWith('fe80:') || ip.startsWith('::ffff:127.')
  );
}
