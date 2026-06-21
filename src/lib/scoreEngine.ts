export interface ScoreFactor {
  label: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  points: number;
  emoji: string;
}

export interface PrivacyScoreResult {
  score: number;
  verdict: 'Clean Profile' | 'Mostly Clean' | 'Suspicious Activity' | 'High Risk';
  summary: string;
  factors: ScoreFactor[];
  ipType: 'residential' | 'datacenter' | 'unknown';
  tzMatch: boolean | null;
}

const DC_KEYWORDS = [
  'amazon', 'aws ', ' aws', 'google cloud', 'gcp', 'azure', 'microsoft cloud',
  'digitalocean', 'linode', 'akamai connected cloud', 'vultr', 'hetzner', 'ovh',
  'cloudflare', 'fastly', 'akamai', 'leaseweb', 'data center', 'datacenter',
  ' vps', 'vps ', 'cloud server', 'colocation', 'dedicated server',
  'cogent', 'level 3', 'hurricane electric', 'zenlayer', 'quadranet',
  'tzulo', 'choopa', 'psychz', 'rackspace', 'ibm cloud', 'oracle cloud',
  'alibaba cloud', 'tencent cloud', 'serverius', 'nexeon', 'lirva',
  'path network', 'fdcservers', 'coresite', 'equinix', 'switch.com',
  'databank', 'cyxtera', 'latisys', 'ntt communications',
];

const RESIDENTIAL_KEYWORDS = [
  'telecom', 'mobile', 'cellular', 'broadband', 'internet service',
  'communications', 'cable', 'fiber', 'dsl', 'wireless', 'network pvt',
  'pta', 'ptcl', 'telenor', 'jazz', 'zong', 'ufone', 'warid',
  'jio', 'airtel', 'bsnl', 'vodafone', 'idea', 'tata',
  'at&t', 'verizon', 'comcast', 'charter', 'spectrum', 't-mobile',
  'bt ', ' bt', 'sky broadband', 'virgin media', 'o2 ',
  'turkcell', 'etisalat', 'stc', 'ooredoo', 'du telecom',
];

function detectIpType(isp: string | null, org: string | null, asn: string | null): 'residential' | 'datacenter' | 'unknown' {
  const text = [isp, org, asn].filter(Boolean).join(' ').toLowerCase();
  if (!text) return 'unknown';

  const dcScore = DC_KEYWORDS.filter(k => text.includes(k)).length;
  const resScore = RESIDENTIAL_KEYWORDS.filter(k => text.includes(k)).length;

  if (dcScore > resScore && dcScore > 0) return 'datacenter';
  if (resScore > 0) return 'residential';

  if (/as\d{4,6}/i.test(text)) return 'unknown';
  return 'unknown';
}

function tzMatches(browserTz: string | null | undefined, ipTz: string | null | undefined): boolean | null {
  if (!browserTz || !ipTz) return null;
  if (browserTz === ipTz) return true;

  const extractRegion = (tz: string) => {
    const parts = tz.split('/');
    return parts[parts.length - 1].toLowerCase().replace(/_/g, ' ');
  };
  return extractRegion(browserTz) === extractRegion(ipTz);
}

export function computePrivacyScore(inputs: {
  ipInfo: { timezone: string | null; isp: string | null; asn: string | null; org: string | null; } | null;
  datetime: { browserTimezone: string; } | null;
  hardware: { cores: number; ram: string; canvasHash: string; } | null;
  network: { webrtcIps: string[]; } | null;
  browser: { languages: readonly string[]; primaryLanguage: string; } | null;
  fonts: string[] | null;
}): PrivacyScoreResult {
  const factors: ScoreFactor[] = [];
  let score = 50;

  const ipType = detectIpType(
    inputs.ipInfo?.isp ?? null,
    inputs.ipInfo?.org ?? null,
    inputs.ipInfo?.asn ?? null,
  );
  const tzMatch = tzMatches(inputs.datetime?.browserTimezone, inputs.ipInfo?.timezone);

  // ── 1. TIMEZONE CONSISTENCY ───────────────────────────────────────────────
  if (tzMatch === true) {
    score += 18;
    factors.push({
      label: 'Timezone Match',
      description: `Browser timezone (${inputs.datetime?.browserTimezone}) matches IP timezone — no VPN shift detected.`,
      impact: 'positive', points: +18, emoji: '✅',
    });
  } else if (tzMatch === false) {
    score -= 22;
    factors.push({
      label: 'Timezone Mismatch',
      description: `Browser reports ${inputs.datetime?.browserTimezone} but IP resolves to ${inputs.ipInfo?.timezone}. Strong indicator of VPN or proxy usage.`,
      impact: 'negative', points: -22, emoji: '❌',
    });
  } else {
    factors.push({
      label: 'Timezone Check',
      description: 'Could not compare — IP or browser timezone unavailable.',
      impact: 'neutral', points: 0, emoji: '⚠️',
    });
  }

  // ── 2. IP TYPE (RESIDENTIAL VS DATACENTER) ────────────────────────────────
  if (ipType === 'residential') {
    score += 16;
    factors.push({
      label: 'Residential IP',
      description: `ISP "${inputs.ipInfo?.isp}" is classified as a residential/mobile provider — typical for real users.`,
      impact: 'positive', points: +16, emoji: '✅',
    });
  } else if (ipType === 'datacenter') {
    score -= 18;
    factors.push({
      label: 'Datacenter IP',
      description: `ASN/ISP "${inputs.ipInfo?.isp || inputs.ipInfo?.org}" belongs to a cloud or hosting provider — commonly used by VPNs, bots, and proxies.`,
      impact: 'negative', points: -18, emoji: '❌',
    });
  } else {
    score -= 4;
    factors.push({
      label: 'IP Type Unknown',
      description: 'Cannot classify IP as residential or datacenter — ambiguous ISP data.',
      impact: 'neutral', points: -4, emoji: '⚠️',
    });
  }

  // ── 3. WEBRTC FINGERPRINT ─────────────────────────────────────────────────
  const webrtcIps = inputs.network?.webrtcIps ?? [];
  if (webrtcIps.length > 0) {
    const hasLocal = webrtcIps.some(ip => ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.'));
    if (hasLocal) {
      score += 8;
      factors.push({
        label: 'WebRTC Local IP Visible',
        description: `Your real local network IP (${webrtcIps.filter(ip => ip.startsWith('192.168.') || ip.startsWith('10.'))[0] ?? webrtcIps[0]}) is exposed via WebRTC — indicates a real browser on a real network.`,
        impact: 'positive', points: +8, emoji: '✅',
      });
    } else {
      score += 3;
      factors.push({
        label: 'WebRTC Active',
        description: 'WebRTC is active and leaking IPs, though no local subnet IP found.',
        impact: 'positive', points: +3, emoji: '✅',
      });
    }
  } else {
    score -= 5;
    factors.push({
      label: 'No WebRTC IP',
      description: 'WebRTC returned no IPs — your browser may be blocking it (privacy tool / VPN) or this is a headless browser.',
      impact: 'negative', points: -5, emoji: '⚠️',
    });
  }

  // ── 4. CANVAS FINGERPRINT ─────────────────────────────────────────────────
  const canvas = inputs.hardware?.canvasHash ?? '';
  if (canvas && canvas !== '00000000' && canvas.length >= 6) {
    score += 6;
    factors.push({
      label: 'Canvas Fingerprint Unique',
      description: `Your GPU renders a unique canvas signature (${canvas}) — consistent with real hardware rendering, not a spoofed or headless environment.`,
      impact: 'positive', points: +6, emoji: '✅',
    });
  } else {
    score -= 8;
    factors.push({
      label: 'Canvas Fingerprint Blocked',
      description: 'No canvas fingerprint detected — likely blocked by a privacy extension or running in a sandboxed/automated browser.',
      impact: 'negative', points: -8, emoji: '⚠️',
    });
  }

  // ── 5. HARDWARE CONSISTENCY ───────────────────────────────────────────────
  const cores = inputs.hardware?.cores ?? 0;
  const ram = inputs.hardware?.ram ?? '';
  if (cores >= 2 && ram && ram !== 'Unavailable') {
    score += 5;
    factors.push({
      label: 'Hardware Plausible',
      description: `${cores} CPU cores and ${ram} RAM — values are consistent with a real consumer device.`,
      impact: 'positive', points: +5, emoji: '✅',
    });
  } else if (cores === 0) {
    score -= 8;
    factors.push({
      label: 'Hardware Concealed',
      description: 'Browser is hiding CPU core count — unusual for a standard consumer browser, often seen in automated or hardened environments.',
      impact: 'negative', points: -8, emoji: '⚠️',
    });
  } else {
    factors.push({
      label: 'Hardware Partial',
      description: 'Some hardware values unavailable — may be privacy settings or an older browser.',
      impact: 'neutral', points: 0, emoji: '⚠️',
    });
  }

  // ── 6. LANGUAGE FINGERPRINT ───────────────────────────────────────────────
  const langs = inputs.browser?.languages ?? [];
  if (langs.length >= 2) {
    score += 4;
    factors.push({
      label: 'Natural Language Profile',
      description: `${langs.length} languages set (${[...langs].slice(0, 3).join(', ')}) — reflects a real user's browser preferences.`,
      impact: 'positive', points: +4, emoji: '✅',
    });
  } else if (langs.length === 1) {
    score += 2;
    factors.push({
      label: 'Single Language Set',
      description: `Browser language: ${langs[0]}. Only one language — slightly unusual but acceptable.`,
      impact: 'positive', points: +2, emoji: '✅',
    });
  } else {
    score -= 6;
    factors.push({
      label: 'No Language Set',
      description: 'No browser language detected — highly atypical for real users; common in headless or automated environments.',
      impact: 'negative', points: -6, emoji: '❌',
    });
  }

  // ── 7. FONT DIVERSITY ─────────────────────────────────────────────────────
  const fontCount = inputs.fonts?.length ?? 0;
  if (fontCount >= 20) {
    score += 5;
    factors.push({
      label: 'Rich Font Profile',
      description: `${fontCount} system fonts detected — a diverse font library is characteristic of a real installed operating system.`,
      impact: 'positive', points: +5, emoji: '✅',
    });
  } else if (fontCount >= 5) {
    score += 2;
    factors.push({
      label: 'Some Fonts Detected',
      description: `${fontCount} fonts found — limited but present.`,
      impact: 'positive', points: +2, emoji: '✅',
    });
  } else if (inputs.fonts !== null) {
    score -= 4;
    factors.push({
      label: 'Minimal Font Profile',
      description: `Only ${fontCount} fonts detected — sandboxed environments and bots typically expose very few fonts.`,
      impact: 'negative', points: -4, emoji: '⚠️',
    });
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let verdict: PrivacyScoreResult['verdict'];
  let summary: string;

  if (finalScore >= 82) {
    verdict = 'Clean Profile';
    summary = 'Your browser fingerprint looks like a genuine human user. All major signals align — residential IP, matching timezone, real hardware, and natural browser behavior.';
  } else if (finalScore >= 62) {
    verdict = 'Mostly Clean';
    summary = 'Your profile is mostly consistent with a real user but shows a few minor inconsistencies. Some signals raised a low-confidence flag.';
  } else if (finalScore >= 42) {
    verdict = 'Suspicious Activity';
    summary = 'Multiple signals suggest your connection may be routed through a VPN, proxy, or datacenter. Your profile does not match a typical residential user.';
  } else {
    verdict = 'High Risk';
    summary = 'Strong indicators of non-human or highly anonymized traffic. Timezone mismatch, datacenter IP, and/or missing fingerprint signals detected simultaneously.';
  }

  return { score: finalScore, verdict, summary, factors, ipType, tzMatch };
}
