import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Smartphone, Monitor, Tablet, Cpu,
  Fingerprint, Zap, ShieldCheck, ChevronDown, ChevronUp, RotateCcw,
  Apple, Chrome, Terminal, Loader2, Play,
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
  if (/iPhone OS (\d+_\d+)/.test(ua)) return { os: 'iOS', version: ua.match(/iPhone OS (\d+_\d+)/)?.
