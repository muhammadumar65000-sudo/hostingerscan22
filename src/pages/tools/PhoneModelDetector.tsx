import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Smartphone, Monitor, Tablet, Cpu,
  Fingerprint, Zap, ShieldCheck, ChevronDown, ChevronUp, RotateCcw,
  Apple, Terminal, Loader2, Play,
  MapPin, Globe, Wifi, Type, Clock, Server, AlertTriangle,
} from 'lucide-react';
import { lookupModel, identifyBrand } from '@/lib/deviceModels';
import {
  detectFonts, getNetworkInfo, getWebRTCLocalIPs, getCanvasFingerprint,
  getLocaleInfo, getPlatformInfo, fetchIpInfo,
  type IpInfoResponse, type NetworkInfo,
} from '@/lib/fingerprint';
import ScanOverlay from '@/components/scan/ScanOverlay';
import SectionCard, { KvCell, KvRow, type SectionStatus } from '@/components/scan/SectionCard';
import PrivacyScore from '@/components/scan/PrivacyScore';
import { computePrivacyScore } from '@/lib/scoreEngine';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

interface DeviceInfo {
  displayName: string;
  brand: string;
  modelCode: string;
  type: 'Phone' | 'Tablet' | 'Desktop';
  resolvedFromDb?: boolean;
  os: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
  screenRes: string;
  viewportRes: string;
  pixelRatio: number;
  ram: string;
  cores: number;
  gpu: string;
  touchPoints: number;
  platform: string;
  architecture: string;
  ua: string;
}

interface HardwareDetail {
  type: string;
  cores: number;
  ram: string;
  gpu: string;
  screenRes: string;
  viewportRes: string;
  pixelRatio: number;
  touchPoints: number;
  colorDepth: number;
  canvasHash: string;
}

interface BrowserDetail {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  ua: string;
  platform: string;
  cookiesEnabled: boolean;
  doNotTrack: string | null;
  online: boolean;
  pdfViewer: boolean;
  primaryLanguage: string;
  languages: string[];
  timezone: string;
  timezoneOffset: number;
}

interface DateTimeDetail {
  browserTimezone: string;
  browserTime: string;
  browserOffset: number;
  isDST: boolean;
}

interface NetworkDetail {
  net: NetworkInfo;
  webrtcIps: string[];
}

function getDeviceType(ua: string): 'Phone' | 'Tablet' | 'Desktop' {
  if (/iPad|Tablet/i.test(ua)) return 'Tablet';
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return 'Tablet';
  if (/Android|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'Phone';
  if (navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) > 600 && Math.min(screen.width, screen.height) < 1100) return 'Tablet';
  return 'Desktop';
}

function resolveDevice(rawModel: string, type: 'Phone' | 'Tablet' | 'Desktop') {
  const entry = lookupModel(rawModel);
  if (entry) {
    return { displayName: `${entry.brand} ${entry.marketName}`, brand: entry.brand, modelCode: rawModel, type, resolvedFromDb: true };
  }
  const brand = identifyBrand(rawModel);
  const cleanName = rawModel
    .replace(/^SM-/, 'Galaxy ').replace(/^CPH/, 'OPPO ').replace(/^RMX/, 'Realme ')
    .replace(/^V(\d)/, 'Vivo V$1').replace(/^XT/, 'Moto ').replace(/^TA-/, 'Nokia ');
  return {
    displayName: brand !== 'Android' ? `${brand} ${cleanName !== rawModel ? cleanName : rawModel}` : cleanName,
    brand, modelCode: rawModel, type, resolvedFromDb: false,
  };
}

function detectIphone() {
  if (!/iPhone/.test(navigator.userAgent)) return null;
  const ratio = window.devicePixelRatio || 1;
  const h = Math.max(screen.height, screen.width);
  const w = Math.min(screen.height, screen.width);
  let model = 'iPhone';
  if (ratio === 3 && h === 956 && w === 440) model = 'iPhone 16 Pro Max';
  else if (ratio === 3 && h === 874 && w === 402) model = 'iPhone 16 Pro';
  else if (ratio === 3 && h === 932 && w === 430) model = 'iPhone 15 Pro Max / 16 Plus';
  else if (ratio === 3 && h === 852 && w === 393) model = 'iPhone 15 Pro / 16';
  else if (ratio === 3 && h === 844 && w === 390) model = 'iPhone 14 / 15 / 13 / 12';
  else if (ratio === 3 && h === 926 && w === 428) model = 'iPhone 14 Plus / 13 Pro Max';
  else if (ratio === 3 && h === 896 && w === 414) model = 'iPhone 11 Pro Max / XS Max';
  else if (ratio === 2 && h === 896 && w === 414) model = 'iPhone 11 / XR';
  else if (ratio === 3 && h === 812 && w === 375) model = 'iPhone X / XS / 11 Pro';
  else if (ratio === 2 && h === 736 && w === 414) model = 'iPhone 8 Plus / 7 Plus';
  else if (ratio === 2 && h === 667 && w === 375) model = 'iPhone SE (3rd) / 8 / 7 / 6s';
  else if (ratio === 2 && h === 568 && w === 320) model = 'iPhone SE (1st) / 5s';
  else if (ratio === 3 && h === 780 && w === 360) model = 'iPhone 12 Mini / 13 Mini';
  return { displayName: `Apple ${model}`, brand: 'Apple', modelCode: model, type: 'Phone' as const };
}

function detectFromUA(ua: string, type: 'Phone' | 'Tablet' | 'Desktop') {
  if (/iPad/.test(ua)) return { displayName: 'Apple iPad', brand: 'Apple', modelCode: 'iPad', type: 'Tablet' as const };
  const patterns: Array<{ regex: RegExp; extract: (m: RegExpMatchArray) => string }> = [
    { regex: /SM-([A-Za-z]\d{3,4}[A-Za-z0-9/]*)/i, extract: (m) => `SM-${m[1]}` },
    { regex: /Pixel\s*(\d+\s*\w*)/i, extract: (m) => `Pixel ${m[1].trim()}` },
    { regex: /ONEPLUS\s*([A-Za-z0-9\s]+?)[\s;)]/i, extract: (m) => m[1].trim() },
    { regex: /(NE|LE|IN|AC|IV)\d{4}/i, extract: (m) => m[0] },
    { regex: /Redmi\s+([A-Za-z0-9+]+(?:\s+[A-Za-z0-9+]+)*?)\s*(?=Build\/|;|\))/i, extract: (m) => `Redmi ${m[1].trim()}` },
    { regex: /POCO\s+([A-Za-z0-9+]+(?:\s+[A-Za-z0-9+]+)*?)\s*(?=Build\/|;|\))/i, extract: (m) => `POCO ${m[1].trim()}` },
    { regex: /(M2[0-9]{6}[A-Z0-9]*)/i, extract: (m) => m[1] },
    { regex: /(2[0-9]{7,9}[A-Z0-9]*)/i, extract: (m) => m[1] },
    { regex: /HUAWEI\s*([A-Za-z0-9-]+)/i, extract: (m) => m[1] },
    { regex: /(VOG|ELE|ELS|ANA|JNY|MAR|YAL|STK)-[A-Z0-9]+/i, extract: (m) => m[0] },
    { regex: /CPH\d{4}/i, extract: (m) => m[0] },
    { regex: /RMX\d{4}/i, extract: (m) => m[0] },
    { regex: /V\d{4}[A-Z]?(?=[\s;)])/i, extract: (m) => m[0] },
    { regex: /XT\d{4}[A-Z0-9-]*/i, extract: (m) => m[0] },
    { regex: /TA-\d{4}/i, extract: (m) => m[0] },
    { regex: /ASUS_[A-Za-z0-9_]+/i, extract: (m) => m[0] },
    { regex: /XQ-[A-Z]{2}\d{2}/i, extract: (m) => m[0] },
    { regex: /LM-[A-Z]\d{3}/i, extract: (m) => m[0] },
    { regex: /Nokia\s*([A-Za-z0-9.]+)/i, extract: (m) => `Nokia ${m[1]}` },
    { regex: /Infinix\s+([A-Za-z0-9+-]+)/i, extract: (m) => m[1].trim() },
    { regex: /TECNO\s+([A-Za-z0-9+-]+)/i, extract: (m) => m[1].trim() },
    { regex: /OPPO\s+([A-Za-z0-9+-]+)/i, extract: (m) => m[1].trim() },
    { regex: /vivo\s+([A-Za-z0-9+-]+)/i, extract: (m) => m[1].trim() },
    { regex: /moto\s+([a-z0-9+()-]+(?:\s+[a-z0-9+()-]+)*?)\s*(?=Build\/|;|\))/i, extract: (m) => m[1].trim() },
    { regex: /Realme\s+([A-Za-z0-9+-]+)/i, extract: (m) => m[1].trim() },
    { regex: /Nothing\s*([A-Za-z0-9()]+)/i, extract: (m) => m[1] },
  ];
  for (const p of patterns) {
    const m = ua.match(p.regex);
    if (m) { const rawCode = p.extract(m); return resolveDevice(rawCode, type); }
  }
  if (/Android/.test(ua)) {
    const buildMatch = ua.match(/;\s*([^;)]+)\s*Build\//);
    if (buildMatch) { const raw = buildMatch[1].trim(); if (raw && raw !== 'K' && raw.length > 1) return resolveDevice(raw, type); }
  }
  return null;
}

function getGPU(): string {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl') || c.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) return 'Unavailable';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  } catch { return 'Unavailable'; }
}

function getOS(ua: string): { os: string; version: string } {
  if (/iPhone OS (\d+_\d+)/.test(ua)) return { os: 'iOS', version: ua.match(/iPhone OS (\d+_\d+)/)?.[1]?.replace('_', '.') || '' };
  if (/iPad.*OS (\d+_\d+)/.test(ua)) return { os: 'iPadOS', version: ua.match(/OS (\d+_\d+)/)?.[1]?.replace('_', '.') || '' };
  if (/Android (\d+\.?\d*)/.test(ua)) return { os: 'Android', version: ua.match(/Android (\d+\.?\d*)/)?.[1] || '' };
  if (/Windows NT ([\d.]+)/.test(ua)) {
    const v = ua.match(/Windows NT ([\d.]+)/)?.[1] || '';
    const map: Record<string, string> = { '10.0': '10', '6.3': '8.1', '6.2': '8', '6.1': '7' };
    return { os: 'Windows', version: map[v] || v };
  }
  if (/Mac OS X ([\d_.]+)/.test(ua)) return { os: 'macOS', version: (ua.match(/Mac OS X ([\d_.]+)/)?.[1] || '').replace(/_/g, '.') };
  if (/CrOS/.test(ua)) return { os: 'ChromeOS', version: '' };
  if (/Linux/.test(ua)) return { os: 'Linux', version: '' };
  return { os: 'Unknown', version: '' };
}

function getBrowser(ua: string): { browser: string; version: string } {
  const tests: Array<[RegExp, string]> = [
    [/Edg\/([\d.]+)/, 'Edge'], [/OPR\/([\d.]+)/, 'Opera'], [/Firefox\/([\d.]+)/, 'Firefox'],
    [/Chrome\/([\d.]+)/, 'Chrome'], [/Version\/([\d.]+).*Safari/, 'Safari'],
  ];
  for (const [r, name] of tests) {
    const m = ua.match(r);
    if (m) return { browser: name, version: m[1].split('.').slice(0, 2).join('.') };
  }
  return { browser: 'Unknown', version: '' };
}

async function detectDevice(): Promise<DeviceInfo> {
  const ua = navigator.userAgent;
  const type = getDeviceType(ua);
  const osInfo = getOS(ua);
  const browserInfo = getBrowser(ua);
  const gpu = getGPU();
  const nav = navigator as any;
  const uaData = (navigator as any).userAgentData;
  let architecture = 'Unknown';
  let platform = osInfo.os;
  let rawModel = '';
  if (uaData && typeof uaData.getHighEntropyValues === 'function') {
    try {
      const hints = await uaData.getHighEntropyValues(['model', 'platform', 'platformVersion', 'architecture']);
      rawModel = hints.model || '';
      architecture = hints.architecture || architecture;
      if (hints.platform) platform = hints.platform;
      if (osInfo.os === 'Windows' && hints.platformVersion) {
        const major = parseInt(String(hints.platformVersion).split('.')[0], 10);
        if (!Number.isNaN(major)) osInfo.version = major >= 13 ? '11' : '10';
      }
    } catch {}
  }
  const base = {
    os: osInfo.os, osVersion: osInfo.version, browser: browserInfo.browser,
    browserVersion: browserInfo.version, screenRes: `${screen.width} × ${screen.height}`,
    viewportRes: `${window.innerWidth} × ${window.innerHeight}`,
    pixelRatio: window.devicePixelRatio || 1,
    ram: nav.deviceMemory ? `${nav.deviceMemory} GB` : 'Unavailable',
    cores: nav.hardwareConcurrency || 0, gpu, touchPoints: navigator.maxTouchPoints || 0,
    platform, architecture, ua,
  };
  const iphone = detectIphone();
  if (iphone) return { ...iphone, ...base };
  const fromUA = detectFromUA(ua, type);
  if (fromUA) return { ...fromUA, ...base };
  if (rawModel && rawModel !== '' && rawModel !== 'K') return { ...resolveDevice(rawModel, type), ...base };
  if (/Android/.test(ua)) return { displayName: 'Android Device', brand: 'Android', modelCode: 'Unknown', type, ...base };
  let desktopName = 'Desktop Computer'; let desktopBrand = 'Desktop';
  if (/Windows/.test(ua)) { desktopName = 'Windows PC'; desktopBrand = 'Windows'; }
  else if (/Macintosh/.test(ua)) { desktopName = 'Apple Mac'; desktopBrand = 'Apple'; }
  else if (/CrOS/.test(ua)) { desktopName = 'Chromebook'; desktopBrand = 'ChromeOS'; }
  else if (/Linux/.test(ua)) { desktopName = 'Linux PC'; desktopBrand = 'Linux'; }
  return { displayName: desktopName, brand: desktopBrand, modelCode: '—', type: 'Desktop', ...base };
}

function DeviceLogo({ device, size = 72 }: { device: DeviceInfo; size?: number }) {
  const { os, type } = device;
  const iconSize = Math.round(size * 0.8);
  
  if (os === 'Android') return <Smartphone size={iconSize} className="text-[#a4c639]" strokeWidth={1.3} />;
  if (os === 'Windows') return <Monitor size={iconSize} className="text-[#0078d7]" strokeWidth={1.3} />;
  if (os === 'iOS' || os === 'iPadOS' || os === 'macOS') return <Apple size={iconSize} strokeWidth={1.3} fill="currentColor" />;
  if (os === 'ChromeOS') return <Globe size={iconSize} strokeWidth={1.3} className="text-[#fbbc05]" />;
  if (os === 'Linux') return <Terminal size={iconSize} strokeWidth={1.3} className="text-[#f58c22]" />;
  if (type === 'Tablet') return <Tablet size={iconSize} strokeWidth={1.3} />;
  if (type === 'Desktop') return <Monitor size={iconSize} strokeWidth={1.3} />;
  return <Smartphone size={iconSize} strokeWidth={1.3} />;
}

const ALL_KEYS = ['device', 'hardware', 'browser', 'ip', 'datetime', 'network', 'fonts'] as const;
type SectionKey = typeof ALL_KEYS[number];

const SECTION_META: Record<SectionKey, { title: string; icon: React.ReactNode }> = {
  device:   { title: 'Device Model',    icon: <Smartphone size={17} strokeWidth={2.2} /> },
  hardware: { title: 'Hardware',        icon: <Cpu size={17} strokeWidth={2.2} /> },
  browser:  { title: 'User-Agent',      icon: <Globe size={17} strokeWidth={2.2} /> },
  ip:       { title: 'IP & Location',   icon: <MapPin size={17} strokeWidth={2.2} /> },
  datetime: { title: 'Date & Time',      icon: <Clock size={17} strokeWidth={2.2} /> },
  network:  { title: 'Network & DNS',   icon: <Wifi size={17} strokeWidth={2.2} /> },
  fonts:    { title: 'Installed Fonts', icon: <Type size={17} strokeWidth={2.2} /> },
};

export default function PhoneModelDetector() {
  const [statuses, setStatuses] = useState<Record<SectionKey, SectionStatus>>({
    device: 'idle', hardware: 'idle', browser: 'idle',
    ip: 'idle', datetime: 'idle', network: 'idle', fonts: 'idle',
  });

  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [hardware, setHardware] = useState<HardwareDetail | null>(null);
  const [browser, setBrowser] = useState<BrowserDetail | null>(null);
  const [ipInfo, setIpInfo] = useState<IpInfoResponse | null>(null);
  const [datetime, setDatetime] = useState<DateTimeDetail | null>(null);
  const [network, setNetwork] = useState<NetworkDetail | null>(null);
  const [fonts, setFonts] = useState<string[] | null>(null);

  const [overlayPhase, setOverlayPhase] = useState<'idle' | 'scanning' | 'done'>('idle');
  const overlayStartRef = useRef<number>(0);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSt = (k: SectionKey, s: SectionStatus) =>
    setStatuses((prev) => ({ ...prev, [k]: s }));

  const isLocked = overlayPhase === 'scanning';

  const scanDevice = useCallback(async () => {
    setSt('device', 'scanning');
    try {
      const result = await detectDevice();
      setDevice(result);
      setSt('device', 'done');
    } catch { setSt('device', 'error'); }
  }, []);

  const scanHardware = useCallback(async () => {
    setSt('hardware', 'scanning');
    try {
      await new Promise((r) => setTimeout(r, 250));
      const ua = navigator.userAgent;
      const type = getDeviceType(ua);
      const sw = screen.width * (window.devicePixelRatio || 1);
      const sh = screen.height * (window.devicePixelRatio || 1);
      let gpu = 'Unknown';
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) { const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info'); if (ext) gpu = (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_RENDERER_WEBGL) as string; }
      } catch {}
      const ramVal = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
      setHardware({
        type, cores: navigator.hardwareConcurrency || 0,
        ram: ramVal ? `${ramVal} GB` : 'Unavailable', gpu,
        screenRes: `${Math.round(sw)} × ${Math.round(sh)}`,
        viewportRes: `${window.innerWidth} × ${window.innerHeight}`,
        pixelRatio: window.devicePixelRatio || 1,
        touchPoints: navigator.maxTouchPoints || 0,
        colorDepth: window.screen.colorDepth,
        canvasHash: getCanvasFingerprint(),
      });
      setSt('hardware', 'done');
    } catch { setSt('hardware', 'error'); }
  }, []);

  const scanBrowser = useCallback(async () => {
    setSt('browser', 'scanning');
    try {
      await new Promise((r) => setTimeout(r, 250));
      const ua = navigator.userAgent;
      const { browser: bn, version: bv } = getBrowser(ua);
      const { os: on, version: ov } = getOS(ua);
      const locale = getLocaleInfo();
      const plat = getPlatformInfo();
      setBrowser({
        browser: bn, browserVersion: bv, os: on, osVersion: ov, ua,
        platform: plat.platform, cookiesEnabled: plat.cookiesEnabled,
        doNotTrack: plat.doNotTrack, online: plat.online, pdfViewer: plat.pdfViewer,
        primaryLanguage: locale.primary, languages: locale.languages,
        timezone: locale.timezone, timezoneOffset: locale.timezoneOffset,
      });
      setSt('browser', 'done');
    } catch { setSt('browser', 'error'); }
  }, []);

  const scanIp = useCallback(async () => {
    setSt('ip', 'scanning');
    try {
      const data = await fetchIpInfo();
      if (!data) { setSt('ip', 'error'); return; }
      setIpInfo(data);
      setSt('ip', 'done');
    } catch { setSt('ip', 'error'); }
  }, []);

  const scanDatetime = useCallback(async () => {
    setSt('datetime', 'scanning');
    try {
      await new Promise((r) => setTimeout(r, 200));
      const now = new Date();
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offset = -now.getTimezoneOffset();
      const jan = new Date(now.getFullYear(), 0, 1);
      const jul = new Date(now.getFullYear(), 6, 1);
      const isDST = -now.getTimezoneOffset() > Math.min(-jan.getTimezoneOffset(), -jul.getTimezoneOffset());
      setDatetime({ browserTimezone: tz, browserTime: now.toString(), browserOffset: offset, isDST });
      setSt('datetime', 'done');
    } catch { setSt('datetime', 'error'); }
  }, []);

  const scanNetwork = useCallback(async () => {
    setSt('network', 'scanning');
    try {
      const [ips] = await Promise.all([getWebRTCLocalIPs()]);
      setNetwork({ net: getNetworkInfo(), webrtcIps: ips });
      setSt('network', 'done');
    } catch { setSt('network', 'error'); }
  }, []);

  const scanFonts = useCallback(async () => {
    setSt('fonts', 'scanning');
    try {
      await new Promise((r) => setTimeout(r, 250));
      const list = detectFonts();
      setFonts(list);
      setSt('fonts', 'done');
    } catch { setSt('fonts', 'error'); }
  }, []);

  const SCAN_FNS: Record<SectionKey, () => Promise<void>> = {
    device: scanDevice, hardware: scanHardware, browser: scanBrowser,
    ip: scanIp, datetime: scanDatetime, network: scanNetwork, fonts: scanFonts,
  };

  const scanAll = useCallback(async () => {
    if (overlayTimerRef.current) { clearTimeout(overlayTimerRef.current); overlayTimerRef.current = null; }
    setDevice(null); setHardware(null); setBrowser(null);
    setIpInfo(null); setDatetime(null); setNetwork(null); setFonts(null);
    overlayStartRef.current = Date.now();
    setOverlayPhase('scanning');
    setStatuses({ device: 'scanning', hardware: 'scanning', browser: 'scanning', ip: 'scanning', datetime: 'scanning', network: 'scanning', fonts: 'scanning' });
    await Promise.allSettled(ALL_KEYS.map((k) => SCAN_FNS[k]()));
    const elapsed = Date.now() - overlayStartRef.current;
    if (elapsed < 2000) await new Promise((r) => setTimeout(r, 2000 - elapsed));
    setOverlayPhase('done');
    overlayTimerRef.current = setTimeout(() => { setOverlayPhase('idle'); overlayTimerRef.current = null; }, 1200);
  }, [scanDevice, scanHardware, scanBrowser, scanIp, scanDatetime, scanNetwork, scanFonts]);

  // Initial auto-scan on load
  useEffect(() => {
    scanAll();
    return () => { if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current); };
  }, []);

  const isScanning = overlayPhase === 'scanning' || Object.values(statuses).some((s) => s === 'scanning');
  const allDone = ALL_KEYS.every((k) => statuses[k] === 'done');

  const privacyScore = useMemo(() => {
    if (!allDone) return null;
    return computePrivacyScore({
      ipInfo: ipInfo ? { timezone: ipInfo.timezone, isp: ipInfo.isp, asn: ipInfo.asn, org: ipInfo.org } : null,
      datetime: datetime ? { browserTimezone: datetime.browserTimezone } : null,
      hardware: hardware ? { cores: hardware.cores, ram: hardware.ram, canvasHash: hardware.canvasHash } : null,
      network: network ? { webrtcIps: network.webrtcIps } : null,
      browser: browser ? { languages: browser.languages, primaryLanguage: browser.primaryLanguage } : null,
      fonts: fonts,
    });
  }, [allDone, ipInfo, datetime, hardware, network, browser, fonts]);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <ScanOverlay phase={overlayPhase} />

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,212,106,0.06) 0%, transparent 70%)' }} />
      </div>

      <SiteNav />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-16">
        <section className="text-center mb-10 sm:mb-12 fade-in-up">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-[-0.04em] leading-[0.95] text-foreground mb-5">
            Scan your <span className="text-gradient">device</span><span className="text-primary">.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Full browser fingerprint analysis — device model, hardware, IP location, timezone, WebRTC leaks, fonts, and a Trust Score. All computed instantly.
          </p>
        </section>

        <section className="mb-8 sm:mb-10 fade-in-up" style={{ animationDelay: '60ms' }}>
          <div className="relative">
            <div className="absolute -inset-1 rounded-3xl pointer-events-none transition-opacity duration-700"
              style={{ background: overlayPhase === 'scanning' ? 'radial-gradient(ellipse at center, rgba(255,59,59,0.35) 0%, transparent 70%)' : 'radial-gradient(ellipse at center, rgba(0,212,106,0.35) 0%, transparent 70%)', filter: 'blur(20px)' }} />
            <div className="relative rounded-3xl overflow-hidden p-5 sm:p-7 transition-all duration-700"
              style={{ background: overlayPhase === 'scanning' ? 'linear-gradient(135deg, rgba(255,59,59,0.18) 0%, rgba(255,59,59,0.06) 100%)' : 'linear-gradient(135deg, rgba(0,212,106,0.18) 0%, rgba(0,212,106,0.06) 100%)', border: overlayPhase === 'scanning' ? '1px solid rgba(255,59,59,0.28)' : '1px solid rgba(0,212,106,0.28)' }}>
              <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3 min-w-0">
                  {isScanning && <Loader2 size={28} className="text-foreground animate-spin flex-shrink-0" strokeWidth={2.5} />}
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-3xl font-black tracking-tight text-foreground leading-tight" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>
                      {!isScanning && !allDone && 'Check My Device'}
                      {isScanning && 'Checking your device...'}
                      {allDone && !isScanning && 'Check complete'}
                    </h2>
                    <div className="text-[11px] sm:text-xs text-foreground/60 font-mono mt-1 tracking-wide">
                      {!isScanning && !allDone && 'Seven checks · device, hardware, browser, IP, time, network, fonts'}
                      {isScanning && 'Scanning your browser signals, please wait...'}
                      {allDone && !isScanning && 'All checks completed successfully'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={scanAll}
                  disabled={isScanning}
                  className="group relative flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-bold transition-all hover:scale-[1.03] active:scale-[0.98] flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(180deg, #00e676 0%, #00c853 100%)', color: '#0a0a0a', boxShadow: '0 8px 24px rgba(0,212,106,0.35), 0 0 0 1px rgba(255,255,255,0.15) inset' }}
                >
                  {isScanning ? <><Loader2 size={14} className="animate-spin" /> <span>Checking...</span></> : allDone ? <><RotateCcw size={14} /> <span>Check Again</span></> : <><span>Check My Device</span><Play size={14} fill="#0a0a0a" className="ml-0.5" /></>}
                </button>
              </div>
            </div>
          </div>
        </section>

        {privacyScore && (
          <section className="mb-8 fade-in-up" style={{ animationDelay: '80ms' }}>
            <PrivacyScore result={privacyScore} />
          </section>
        )}

        <section className="mb-16 fade-in-up" style={{ animationDelay: '120ms' }}>
          <div className="grid sm:grid-cols-2 gap-6">
            
            {/* 1. DEVICE MODEL CARD */}
            <div className="sm:col-span-2">
              <SectionCard {...SECTION_META.device} status={statuses.device} onScan={scanDevice} locked={isLocked}>
                {device && (
                  <div className="flex items-center gap-6 p-2">
                    <DeviceLogo device={device} size={64} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                      <KvCell label="Identified" value={device.displayName} />
                      <KvCell label="OS" value={`${device.os} ${device.osVersion}`} />
                      <KvCell label="Browser" value={`${device.browser} ${device.browserVersion}`} />
                      <KvCell label="Architecture" value={device.architecture} mono />
                    </div>
                  </div>
                )}
              </SectionCard>
            </div>

            {/* 2. IP & LOCATION CARD */}
            <SectionCard {...SECTION_META.ip} status={statuses.ip} onScan={scanIp} locked={isLocked}>
              {ipInfo && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <KvCell label="IP Address" value={ipInfo.ip} mono />
                  <KvCell label="Country" value={ipInfo.country ? `${ipInfo.country} (${ipInfo.countryCode})` : null} />
                  <KvCell label="City" value={ipInfo.city} />
                  <KvCell label="Region / State" value={ipInfo.region} />
                  <KvCell label="ISP / Organization" value={ipInfo.isp || ipInfo.org} wide />
                  <KvCell label="ASN" value={ipInfo.asn} mono />
                  <KvCell label="Timezone" value={ipInfo.timezone} />
                </div>
              )}
            </SectionCard>

            {/* 3. USER-AGENT CARD */}
            <SectionCard {...SECTION_META.browser} status={statuses.browser} onScan={scanBrowser} locked={isLocked}>
              {browser && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <KvCell label="HTTP Browser" value={`${browser.browser} ${browser.browserVersion}`} />
                  <KvCell label="Platform" value={browser.platform} mono />
                  <KvCell label="Do Not Track" value={browser.doNotTrack === null ? 'null' : browser.doNotTrack} />
                  <KvCell label="Hardware Concurrency" value={hardware?.cores} />
                  <KvCell label="Full User-Agent" value={browser.ua} wide mono />
                </div>
              )}
            </SectionCard>

            {/* 4. DATE & TIME CARD */}
            <SectionCard {...SECTION_META.datetime} status={statuses.datetime} onScan={scanDatetime} locked={isLocked}>
              {datetime && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <KvCell label="Timezone from JS" value={datetime.browserTimezone} />
                  <KvCell label="Daylight Saving Time" value={datetime.isDST ? 'Yes' : 'No'} />
                  <KvCell label="Current Time" value={new Date(datetime.browserTime).toLocaleTimeString()} wide font-mono />
                  <KvCell label="Full Date String" value={datetime.browserTime} wide font-mono />
                </div>
              )}
            </SectionCard>

            {/* 5. HARDWARE CARD */}
            <SectionCard {...SECTION_META.hardware} status={statuses.hardware} onScan={scanHardware} locked={isLocked}>
              {hardware && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <KvCell label="WebGL Vendor" value={hardware.gpu.split(',')[0] || 'Available'} wide />
                  <KvCell label="WebGL Renderer" value={hardware.gpu.split(',')[1] || hardware.gpu} wide />
                  <KvCell label="CPU Cores" value={hardware.cores} />
                  <KvCell label="RAM (Approx)" value={hardware.ram} />
                  <KvCell label="Screen Resolution" value={hardware.screenRes} mono />
                  <KvCell label="Viewport Size" value={hardware.viewportRes} mono />
                  <KvCell label="Color Depth" value={`${hardware.colorDepth} bits`} />
                  <KvCell label="Canvas Fingerprint" value={hardware.canvasHash.substring(0, 16) + '...'} mono wide />
                </div>
              )}
            </SectionCard>

            {/* 6. NETWORK & DNS CARD */}
            <SectionCard {...SECTION_META.network} status={statuses.network} onScan={scanNetwork} locked={isLocked}>
              {network && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <KvCell label="Downlink Speed" value={network.net.downlink ? `${network.net.downlink} Mbps` : 'N/A'} />
                  <KvCell label="Effective Type" value={network.net.effectiveType || 'N/A'} mono />
                  <KvCell label="WebRTC Local IPs" value={network.webrtcIps.length > 0 ? network.webrtcIps.join(', ') : 'No leaks / None'} wide mono />
                </div>
              )}
            </SectionCard>

            {/* 7. INSTALLED FONTS CARD */}
            <SectionCard {...SECTION_META.fonts} status={statuses.fonts} onScan={scanFonts} locked={isLocked}>
              {fonts && (
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground mb-2">Detected system fonts baseline:</div>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                    {fonts.slice(0, 30).map((font) => (
                      <span key={font} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-[11px] rounded font-mono">
                        {font}
                      </span>
                    ))}
                    {fonts.length > 30 && (
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[11px] rounded font-mono">
                        + {fonts.length - 30} more fonts
                      </span>
                    )}
                  </div>
                </div>
              )}
            </SectionCard>

          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
