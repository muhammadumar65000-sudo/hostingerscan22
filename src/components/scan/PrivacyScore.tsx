import { useEffect, useRef, useState } from 'react';
import type { PrivacyScoreResult } from '@/lib/scoreEngine';

interface Props {
  result: PrivacyScoreResult;
}

function scoreColor(score: number) {
  if (score >= 82) return { hex: '#00d46a', dim: 'rgba(0,212,106,0.12)', border: 'rgba(0,212,106,0.2)', label: '#00d46a' };
  if (score >= 62) return { hex: '#a3e635', dim: 'rgba(163,230,53,0.10)', border: 'rgba(163,230,53,0.2)', label: '#a3e635' };
  if (score >= 42) return { hex: '#f59e0b', dim: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.2)', label: '#f59e0b' };
  return               { hex: '#ef4444', dim: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.2)',  label: '#ef4444'  };
}

function ArcGauge({ score, color }: { score: number; color: ReturnType<typeof scoreColor> }) {
  const [v, setV] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const dur = 1200;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setV(Math.round(ease * score));
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [score]);

  const R = 56, cx = 70, cy = 70;
  const sweep = 260;
  const startA = -220;
  const arc = (r: number, a1: number, a2: number) => {
    const p1 = { x: cx + r * Math.cos(((a1 - 90) * Math.PI) / 180), y: cy + r * Math.sin(((a1 - 90) * Math.PI) / 180) };
    const p2 = { x: cx + r * Math.cos(((a2 - 90) * Math.PI) / 180), y: cy + r * Math.sin(((a2 - 90) * Math.PI) / 180) };
    const lg = a2 - a1 > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${lg} 1 ${p2.x} ${p2.y}`;
  };

  return (
    <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color.hex} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color.hex} />
          </linearGradient>
        </defs>
        <path d={arc(R, startA, startA + sweep)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
        {v > 0 && <path d={arc(R, startA, startA + (sweep * v) / 100)} fill="none" stroke="url(#g)" strokeWidth="8" strokeLinecap="round" />}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black tabular-nums leading-none" style={{ fontSize: 38, color: color.hex, fontFamily: "'Inter', sans-serif", letterSpacing: '-0.04em' }}>{v}</span>
        <span className="text-[10px] font-bold mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>/100</span>
      </div>
    </div>
  );
}

function SignalBar({ factor }: { factor: PrivacyScoreResult['factors'][0] }) {
  const isPos = factor.impact === 'positive';
  const isNeg = factor.impact === 'negative';
  const accentColor = isPos ? '#00d46a' : isNeg ? '#ef4444' : '#f59e0b';
  const bgColor = isPos ? 'rgba(0,212,106,0.06)' : isNeg ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)';

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
      style={{ background: bgColor, borderLeft: `2px solid ${accentColor}` }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[12px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {factor.label}
          </span>
          <span
            className="text-[11px] font-mono font-bold flex-shrink-0 px-1.5 py-0.5 rounded"
            style={{
              color: accentColor,
              background: isPos ? 'rgba(0,212,106,0.12)' : isNeg ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.10)',
            }}
          >
            {factor.points > 0 ? `+${factor.points}` : factor.points === 0 ? '±0' : factor.points}
          </span>
        </div>
        <p className="text-[11px] leading-snug" style={{ color: 'rgba(255,255,255,0.38)' }}>
          {factor.description}
        </p>
      </div>
    </div>
  );
}

export default function PrivacyScore({ result }: Props) {
  const color = scoreColor(result.score);
  const [expanded, setExpanded] = useState(false);

  const neg = result.factors.filter(f => f.impact === 'negative');
  const pos = result.factors.filter(f => f.impact === 'positive');
  const neu = result.factors.filter(f => f.impact === 'neutral');

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(6,12,8,0.98)', border: `1px solid ${color.border}` }}
    >
      {/* Header strip */}
      <div
        className="flex items-center justify-between px-5 py-2.5 border-b"
        style={{ background: color.dim, borderColor: color.border }}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Trust Score Analysis
        </span>
        <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
          {result.factors.length} signals
        </span>
      </div>

      {/* Score + verdict */}
      <div className="flex items-center gap-6 px-5 sm:px-7 py-6">
        <ArcGauge score={result.score} color={color} />

        <div className="flex-1 min-w-0">
          <div
            className="text-2xl sm:text-3xl mb-1.5 leading-tight"
            style={{ color: color.hex, fontFamily: "'Inter', sans-serif", fontWeight: 900, letterSpacing: '-0.03em' }}
          >
            {result.verdict}
          </div>
          <p className="text-[12px] sm:text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {result.summary}
          </p>

          {/* Signal count summary */}
          <div className="flex flex-wrap gap-2 mt-3">
            {pos.length > 0 && (
              <span className="text-[11px] font-semibold px-2 py-1 rounded" style={{ background: 'rgba(0,212,106,0.1)', color: '#00d46a' }}>
                {pos.length} passed
              </span>
            )}
            {neg.length > 0 && (
              <span className="text-[11px] font-semibold px-2 py-1 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                {neg.length} flagged
              </span>
            )}
            {neu.length > 0 && (
              <span className="text-[11px] font-semibold px-2 py-1 rounded" style={{ background: 'rgba(245,158,11,0.08)', color: '#fbbf24' }}>
                {neu.length} inconclusive
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown toggle */}
      <div className="px-5 sm:px-7 pb-5">
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full text-[12px] font-semibold py-2 rounded-lg transition-colors text-center"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          {expanded ? '▲  Hide signal breakdown' : '▼  Show signal breakdown'}
        </button>

        {expanded && (
          <div className="mt-3 grid sm:grid-cols-2 gap-1.5">
            {[...neg, ...neu, ...pos].map((f, i) => (
              <SignalBar key={i} factor={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
