import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type SectionStatus = 'idle' | 'scanning' | 'done' | 'error';

interface Props {
  title: string;
  subtitle?: string;
  status: SectionStatus;
  onScan: () => void;
  children?: ReactNode;
  locked?: boolean;
  icon?: ReactNode;
}

export default function SectionCard({ title, status, children, locked, icon }: Props) {
  const isShowingShimmer = status === 'scanning' || (status === 'done' && locked);
  const isShowingContent = (status === 'done' && !locked) || status === 'error';

  return (
    <div
      className="glass-panel rounded-2xl overflow-hidden transition-all duration-500 flex flex-col h-full"
      style={{
        borderColor:
          status === 'done' && !locked
            ? 'rgba(0,212,106,0.2)'
            : isShowingShimmer
            ? 'rgba(255,150,30,0.2)'
            : 'rgba(255,255,255,0.06)',
        boxShadow: status === 'done' && !locked ? '0 0 32px rgba(0,212,106,0.07)' : undefined,
      }}
    >
      {/* header */}
      <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-white/[0.05]">
        {icon && (
          <div
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background:
                status === 'done' && !locked
                  ? 'rgba(0,212,106,0.18)'
                  : status === 'scanning'
                  ? 'rgba(255,150,30,0.13)'
                  : 'rgba(0,212,106,0.10)',
              border:
                '1px solid ' +
                (status === 'done' && !locked
                  ? 'rgba(0,212,106,0.3)'
                  : status === 'scanning'
                  ? 'rgba(255,150,30,0.2)'
                  : 'rgba(0,212,106,0.15)'),
              color:
                status === 'scanning' ? 'rgba(255,150,30,0.9)' : '#00d46a',
            }}
          >
            {status === 'scanning' ? <Loader2 size={17} className="animate-spin" /> : icon}
          </div>
        )}
        <div
          className="text-lg sm:text-xl text-foreground tracking-tight"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900 }}
        >
          {title}
        </div>
      </div>

      {/* body */}
      <div className="p-5 sm:p-6 flex-1 min-h-[120px]">
        {status === 'idle' && (
          <div className="text-[13px] text-muted-foreground/40 italic">
            Click <span className="font-semibold text-primary/70 not-italic">Check My Device</span> to scan this section.
          </div>
        )}
        {isShowingShimmer && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="h-2.5 rounded skeleton-shimmer w-16 mb-2" />
                <div className="h-4 rounded skeleton-shimmer w-24" />
              </div>
            ))}
          </div>
        )}
        {status === 'error' && (
          <div className="text-[13px] text-destructive">Could not load this section.</div>
        )}
        {isShowingContent && status !== 'error' && children}
      </div>
    </div>
  );
}

/** Pixelscan-style cell: small gray label on top, bold white value below */
export function KvCell({
  label,
  value,
  mono,
  wide,
  warn,
}: {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
  wide?: boolean;
  warn?: boolean;
}) {
  const display = value === null || value === undefined || value === '' ? '—' : String(value);
  const empty = display === '—';
  return (
    <div className={wide ? 'col-span-2 sm:col-span-3' : ''}>
      <div className="text-[11px] font-medium text-muted-foreground/55 mb-1 leading-none">{label}</div>
      <div
        className={`text-[13px] sm:text-[14px] font-bold leading-snug break-words ${
          mono ? 'font-mono' : ''
        } ${empty ? 'text-muted-foreground/30' : warn ? 'text-yellow-400' : 'text-foreground'}`}
      >
        {display}
      </div>
    </div>
  );
}

/** Legacy horizontal row */
export function KvRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
}) {
  const display = value === null || value === undefined || value === '' ? '—' : String(value);
  const empty = display === '—';
  return (
    <div className="flex items-baseline gap-3 py-2 border-b border-white/[0.04] last:border-b-0">
      <span className="text-[12px] font-semibold text-foreground/80 whitespace-nowrap min-w-[140px] sm:min-w-[180px]">
        {label}
      </span>
      <span
        className={`text-[13px] font-bold text-right sm:text-left flex-1 truncate ${
          mono ? 'font-mono' : ''
        } ${empty ? 'text-muted-foreground/40' : 'text-foreground'}`}
        title={display}
      >
        {display}
      </span>
    </div>
  );
}
