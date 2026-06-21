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

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-10">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#00d46a' }}>Legal</div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2" style={{ letterSpacing: '-0.03em' }}>Terms & Conditions</h1>
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Last updated: June 2025</p>
        </div>

        <Section title="1. Acceptance of Terms">
          <p>By accessing or using ScanDevice ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use the Service.</p>
        </Section>

        <Section title="2. Use of the Service">
          <p>ScanDevice is provided for informational and educational purposes only. You may use the Service to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Understand what data your own browser exposes</li>
            <li>Test browser privacy configurations</li>
            <li>Conduct authorized security research</li>
            <li>Verify VPN or proxy configurations</li>
          </ul>
          <p>You may not use the Service to fingerprint or track other users without their explicit consent, or for any unlawful purpose.</p>
        </Section>

        <Section title="3. Intellectual Property">
          <p>All content, design, code, and analysis algorithms of ScanDevice are the intellectual property of ScanDevice and its creators. You may not reproduce, distribute, or create derivative works without prior written permission.</p>
        </Section>

        <Section title="4. Disclaimer of Warranties">
          <p>The Service is provided "as is" without warranties of any kind, express or implied. We do not warrant that results are 100% accurate for all device configurations, browser versions, or network setups.</p>
        </Section>

        <Section title="5. Limitation of Liability">
          <p>ScanDevice and its creators shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of the Service or reliance on information provided.</p>
        </Section>

        <Section title="6. Changes to Terms">
          <p>We reserve the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.</p>
        </Section>

        <Section title="7. Contact">
          <p>For terms-related questions: <a href="mailto:legal@scandevice.online" className="underline" style={{ color: '#00d46a' }}>legal@scandevice.online</a></p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
