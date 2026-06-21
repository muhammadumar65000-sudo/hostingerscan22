import { useEffect, useState } from 'react';

type Phase = 'idle' | 'scanning' | 'done';

interface Props {
  phase: Phase;
}

export default function ScanOverlay({ phase }: Props) {
  const [visible, setVisible] = useState(false);
  const [color, setColor] = useState<'red' | 'green'>('red');

  useEffect(() => {
    if (phase === 'scanning') {
      setColor('red');
      setVisible(true);
      return;
    }
    if (phase === 'done') {
      setColor('green');
      // Hold green visibly for 1.2s before fading out
      const t = setTimeout(() => setVisible(false), 1800);
      return () => clearTimeout(t);
    }
    setVisible(false);
    return;
  }, [phase]);

  if (!visible) return null;

  const accent = color === 'red' ? '255, 59, 59' : '0, 212, 106';

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden transition-opacity duration-700"
      style={{ opacity: phase === 'done' ? 0.85 : 1 }}
    >
      {/* corner vignettes */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at top, rgba(${accent}, 0.18), transparent 55%), radial-gradient(ellipse at bottom, rgba(${accent}, 0.12), transparent 55%)`,
        }}
      />

      {/* sweeping scanline */}
      <div
        className="absolute left-0 right-0 h-[140px] scanline-sweep transition-all duration-700"
        style={{
          background: `linear-gradient(180deg,
            transparent 0%,
            rgba(${accent}, 0.05) 30%,
            rgba(${accent}, 0.35) 50%,
            rgba(${accent}, 0.05) 70%,
            transparent 100%)`,
          boxShadow: `0 0 80px rgba(${accent}, 0.4)`,
        }}
      />

      {/* thin sharp line at center of sweep */}
      <div
        className="absolute left-0 right-0 h-px scanline-sweep transition-all duration-700"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${accent}, 0.9), transparent)`,
          boxShadow: `0 0 24px rgba(${accent}, 1), 0 0 48px rgba(${accent}, 0.7)`,
          marginTop: '70px',
        }}
      />

      {/* faint grid */}
      <div
        className="absolute inset-0 opacity-[0.04] transition-all duration-700"
        style={{
          backgroundImage: `linear-gradient(rgba(${accent}, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(${accent}, 1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}
