import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { Shield, Code2, Zap, Lock } from 'lucide-react';

const VALUES = [
  { icon: <Shield size={22} />, title: 'Privacy First', body: 'Every analysis runs entirely in your browser. We never transmit, store, or process your fingerprint data on any server.' },
  { icon: <Code2 size={22} />, title: 'Built by Developers', body: 'ScanDevice was created by security researchers and web developers who wanted a transparent, no-nonsense tool for browser fingerprint analysis.' },
  { icon: <Zap size={22} />, title: 'Instant Results', body: 'No accounts, no loading screens, no waiting. Paste the URL, click scan, and get your full device profile in seconds.' },
  { icon: <Lock size={22} />, title: 'No Data Stored', body: 'Zero telemetry, zero cookies, zero logs. Your data is yours — we have no way of accessing it even if we wanted to.' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#00d46a' }}>About</div>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-4" style={{ letterSpacing: '-0.03em' }}>
            What is ScanDevice?
          </h1>
          <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            ScanDevice is a professional browser fingerprinting and device analysis tool. We help users, developers, and security researchers understand exactly what information a browser exposes when visiting any website.
          </p>
        </div>

        {/* Values */}
        <div className="grid sm:grid-cols-2 gap-4 mb-14">
          {VALUES.map((v, i) => (
            <div
              key={i}
              className="rounded-xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="mb-3" style={{ color: '#00d46a' }}>{v.icon}</div>
              <div className="text-[15px] font-bold text-white mb-2">{v.title}</div>
              <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{v.body}</p>
            </div>
          ))}
        </div>

        {/* What we detect */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-10"
          style={{ background: 'rgba(0,212,106,0.05)', border: '1px solid rgba(0,212,106,0.15)' }}
        >
          <h2 className="text-xl font-bold text-white mb-4">What ScanDevice Detects</h2>
          <ul className="grid sm:grid-cols-2 gap-y-3 gap-x-6">
            {[
              'Device model (phone, tablet, desktop)',
              'Operating system and version',
              'Browser name and version',
              'IP address and geolocation',
              'ISP and ASN information',
              'Browser timezone vs IP timezone',
              'CPU cores and GPU renderer',
              'RAM and screen resolution',
              'Canvas fingerprint hash',
              'WebRTC IP leaks',
              'Network type and speed',
              'Installed system fonts (30+ checked)',
              'Browser language preferences',
              'Do Not Track status',
              'Cookie and PDF support',
              'Trust Score (7 signals)',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-[13px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00d46a' }} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer note */}
        <p className="text-[12px] text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
          ScanDevice is an independent tool. We are not affiliated with any browser vendor, ISP, or government body. All detection is performed client-side using publicly available browser APIs.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
