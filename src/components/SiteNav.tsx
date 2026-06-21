import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Scan, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Tools', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'About Us', href: '/about' },
];

export default function SiteNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{ background: 'rgba(0,0,0,0.97)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: '#00d46a', boxShadow: '0 0 14px rgba(0,212,106,0.4)' }}
          >
            <Scan size={15} style={{ color: '#000' }} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm text-white tracking-tight" style={{ fontWeight: 800 }}>ScanDevice</span>
            <span className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>scandevice.online</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => {
            const active = location === href;
            return (
              <Link
                key={href}
                href={href}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold transition-all"
                style={{
                  color: active ? '#00d46a' : 'rgba(255,255,255,0.55)',
                  background: active ? 'rgba(0,212,106,0.08)' : 'transparent',
                }}
              >
                {label}
              </Link>
            );
          })}
          <a
            href="mailto:hello@scandevice.online"
            className="ml-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all border"
            style={{ color: '#00d46a', borderColor: 'rgba(0,212,106,0.3)', background: 'rgba(0,212,106,0.06)' }}
          >
            Contact
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 rounded-lg transition-colors"
          style={{ color: 'rgba(255,255,255,0.6)' }}
          onClick={() => setOpen(o => !o)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="sm:hidden border-t px-4 py-4 flex flex-col gap-1"
          style={{ background: 'rgba(0,0,0,0.99)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-lg text-[14px] font-semibold"
              style={{ color: location === href ? '#00d46a' : 'rgba(255,255,255,0.65)', background: location === href ? 'rgba(0,212,106,0.08)' : 'transparent' }}
            >
              {label}
            </Link>
          ))}
          <a
            href="mailto:hello@scandevice.online"
            className="px-4 py-3 rounded-lg text-[14px] font-semibold"
            style={{ color: '#00d46a' }}
          >
            Contact
          </a>
        </div>
      )}
    </nav>
  );
}
