// Client-side fingerprinting helpers — fonts, WebRTC, canvas, network, locale

const TEST_FONTS = [
  "Arial", "Arial Black", "Arial Narrow", "Arial Rounded MT Bold",
  "Bookman Old Style", "Bradley Hand ITC", "Century", "Century Gothic",
  "Comic Sans MS", "Courier", "Courier New", "Cursive", "Georgia", "Gentium",
  "Helvetica", "Helvetica Neue", "Impact", "King", "Lucida Console",
  "Lucida Sans Unicode", "Lalit", "Modena", "Monotype Corsiva", "Papyrus",
  "Tahoma", "TeX", "Times", "Times New Roman", "Trebuchet MS", "Verdana",
  "Verona", "Andale Mono", "AvantGarde", "Baskerville", "Big Caslon",
  "Bodoni 72", "Calibri", "Cambria", "Candara", "Consolas", "Constantia",
  "Corbel", "Didot", "Franklin Gothic Medium", "Futura", "Geneva",
  "Gill Sans", "Hoefler Text", "Lucida Bright", "Lucida Grande",
  "Lucida Sans", "Menlo", "Monaco", "MS Sans Serif", "MS Serif",
  "Optima", "Palatino", "Palatino Linotype", "Perpetua", "Rockwell",
  "Segoe UI", "Sitka", "Skia", "Snell Roundhand", "Symbol", "Wingdings",
  "Zapf Dingbats", "Zapfino", "Roboto", "Open Sans", "Lato", "Montserrat",
  "Source Sans Pro", "Raleway", "Inter", "Poppins", "Noto Sans",
];

const BASE_FONTS = ["monospace", "sans-serif", "serif"] as const;
const TEST_STRING = "mmmmmmmmmmlli";
const TEST_SIZE = "72px";

export function detectFonts(): string[] {
  if (typeof document === "undefined") return [];
  const body = document.body;
  if (!body) return [];

  const span = document.createElement("span");
  span.style.fontSize = TEST_SIZE;
  span.style.position = "absolute";
  span.style.left = "-9999px";
  span.style.top = "-9999px";
  span.style.visibility = "hidden";
  span.style.whiteSpace = "nowrap";
  span.textContent = TEST_STRING;

  const baseSizes: Record<string, { w: number; h: number }> = {};
  for (const base of BASE_FONTS) {
    span.style.fontFamily = base;
    body.appendChild(span);
    baseSizes[base] = { w: span.offsetWidth, h: span.offsetHeight };
    body.removeChild(span);
  }

  const installed: string[] = [];
  for (const font of TEST_FONTS) {
    let detected = false;
    for (const base of BASE_FONTS) {
      span.style.fontFamily = `'${font}', ${base}`;
      body.appendChild(span);
      const w = span.offsetWidth;
      const h = span.offsetHeight;
      body.removeChild(span);
      if (w !== baseSizes[base].w || h !== baseSizes[base].h) {
        detected = true;
        break;
      }
    }
    if (detected) installed.push(font);
  }
  return installed;
}

export interface NetworkInfo {
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean | null;
}

export function getNetworkInfo(): NetworkInfo {
  const conn = (navigator as Navigator & {
    connection?: { effectiveType?: string; downlink?: number; rtt?: number; saveData?: boolean };
  }).connection;
  if (!conn) return { effectiveType: null, downlink: null, rtt: null, saveData: null };
  return {
    effectiveType: conn.effectiveType || null,
    downlink: typeof conn.downlink === "number" ? conn.downlink : null,
    rtt: typeof conn.rtt === "number" ? conn.rtt : null,
    saveData: typeof conn.saveData === "boolean" ? conn.saveData : null,
  };
}

export async function getWebRTCLocalIPs(): Promise<string[]> {
  if (typeof window === "undefined" || typeof RTCPeerConnection === "undefined") return [];

  return new Promise((resolve) => {
    const ips = new Set<string>();
    let pc: RTCPeerConnection | null = null;

    const finish = () => {
      try { pc?.close(); } catch { /* ignore */ }
      resolve(Array.from(ips));
    };

    const timer = setTimeout(finish, 1500);

    try {
      pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pc.createDataChannel("");
      pc.onicecandidate = (e) => {
        if (!e.candidate) {
          clearTimeout(timer);
          finish();
          return;
        }
        const cand = e.candidate.candidate;
        const m = cand.match(/(?:[0-9]{1,3}\.){3}[0-9]{1,3}|[a-fA-F0-9:]+:[a-fA-F0-9:]+/);
        if (m && m[0]) ips.add(m[0]);
      };
      pc.createOffer()
        .then((offer) => pc!.setLocalDescription(offer))
        .catch(() => {
          clearTimeout(timer);
          finish();
        });
    } catch {
      clearTimeout(timer);
      finish();
    }
  });
}

export function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "unavailable";
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("PhoneDetect.net <fp>", 2, 15);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("PhoneDetect.net <fp>", 4, 17);
    const data = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
  } catch {
    return "blocked";
  }
}

export function getLocaleInfo() {
  const langs = Array.isArray(navigator.languages) ? navigator.languages : [navigator.language];
  let tz: string | null = null;
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch { /* ignore */ }
  const offset = -new Date().getTimezoneOffset() / 60;
  return {
    primary: navigator.language,
    languages: langs,
    timezone: tz,
    timezoneOffset: offset,
  };
}

export function getPlatformInfo() {
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string; mobile?: boolean; brands?: { brand: string; version: string }[] };
  };
  return {
    platform: navigator.platform || nav.userAgentData?.platform || "",
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || (window as Window & { doNotTrack?: string }).doNotTrack || null,
    pdfViewer: navigator.pdfViewerEnabled ?? null,
    online: navigator.onLine,
    plugins: Array.from(navigator.plugins || []).map((p) => p.name),
  };
}

export interface IpInfoResponse {
  ip: string;
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  postal: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  isp: string | null;
  org: string | null;
  asn: string | null;
  source: string;
}

export async function fetchIpInfo(): Promise<IpInfoResponse | null> {
  try {
    const baseUrl = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
    const apiBase = baseUrl.replace(/\/browserscan$/, "") + "/api";
    const res = await fetch(`${apiBase}/ipinfo`, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as IpInfoResponse;
  } catch {
    return null;
  }
}
