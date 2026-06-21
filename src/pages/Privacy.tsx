import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-[16px] font-bold text-white mb-3">{title}</h2>
      <div className="text-[13px] leading-relaxed space-y-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {children}
      </div>
    </section>
  );
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-10">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#00d46a' }}>Legal</div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2" style={{ letterSpacing: '-0.03em' }}>Privacy Policy</h1>
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Last updated: June 2025</p>
        </div>

        <div
          className="rounded-xl p-5 mb-8"
          style={{ background: 'rgba(0,212,106,0.06)', border: '1px solid rgba(0,212,106,0.15)' }}
        >
          <p className="text-[13px] font-semibold" style={{ color: '#00d46a' }}>
            ScanDevice does not collect, store, transmit, or share any personal data. All scanning is performed entirely within your browser. Nothing leaves your device.
          </p>
        </div>

        <Section title="1. No Data Collection">
          <p>ScanDevice operates as a fully client-side application. All browser fingerprinting, hardware detection, and analysis runs locally in your browser using standard JavaScript APIs.</p>
          <p>We do not have access to your device data, IP address, browser fingerprint, or any other information gathered by the tool. This data is displayed only to you, on your screen, and is never transmitted to our servers.</p>
        </Section>

        <Section title="2. IP Information">
          <p>When you use the IP &amp; Location feature, your browser requests IP geolocation data from a third-party API (ipapi.co). This request is made directly from your browser. The IP lookup may log your IP address as per ipapi.co's own privacy policy.</p>
          <p>ScanDevice does not store, log, or have access to any IP lookup results.</p>
        </Section>

        <Section title="3. Cookies">
          <p>ScanDevice does not use cookies for tracking, analytics, or advertising. The only browser storage used is sessionStorage for temporary caching of device identification results within the current browser session. This data is automatically deleted when you close the tab.</p>
        </Section>

        <Section title="4. Third-Party Services">
          <p>ScanDevice uses the following third-party service for a specific feature:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-white/70">ipapi.co</strong> — for IP geolocation. Subject to their own terms and privacy policy.</li>
          </ul>
          <p>We do not use Google Analytics, Facebook Pixel, or any advertising or tracking scripts.</p>
        </Section>

        <Section title="5. Contact">
          <p>For privacy-related inquiries, contact us at: <a href="mailto:privacy@scandevice.online" className="underline" style={{ color: '#00d46a' }}>privacy@scandevice.online</a></p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
