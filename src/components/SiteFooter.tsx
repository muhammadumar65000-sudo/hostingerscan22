import { Link } from 'wouter';
import { Scan } from 'lucide-react';

const LEGAL = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Disclaimer', href: '/disclaimer' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'About Us', href: '/about' },
];

export default function SiteFooter() {
  return (
    <footer className="border-t mt-8" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.6)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#00d46a' }}>
                <Scan size={12} style={{ color: '#000' }} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-white">ScanDevice</span>
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Professional browser fingerprint analysis tool. Understand what data your browser exposes online.
            </p>
          </div>

          {/* Tools */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Tools</div>
            <ul className="space-y-2">
              <li><Link href="/" className="text-[13px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>Browser Fingerprint</Link></li>
              <li><Link href="/" className="text-[13px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>IP & Location Check</Link></li>
              <li><Link href="/" className="text-[13px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>WebRTC Leak Test</Link></li>
              <li><Link href="/" className="text-[13px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>Privacy Score</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Legal</div>
            <ul className="space-y-2">
              {LEGAL.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-[13px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            &copy; {new Date().getFullYear()} ScanDevice. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            {LEGAL.map(({ label, href }) => (
              <Link key={href} href={href} className="text-[11px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
