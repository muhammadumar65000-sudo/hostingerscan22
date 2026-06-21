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

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="mb-10">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#00d46a' }}>Legal</div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2" style={{ letterSpacing: '-0.03em' }}>Disclaimer</h1>
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Last updated: June 2025</p>
        </div>

        <Section title="Accuracy of Information">
          <p>ScanDevice provides browser fingerprint analysis using publicly available browser APIs. While we strive for accuracy, results may vary depending on your browser version, operating system, installed extensions, and privacy settings.</p>
          <p>The Trust Score and other assessments are heuristic estimates based on weighted signal analysis. They should be treated as indicative, not definitive.</p>
        </Section>

        <Section title="Not Legal or Security Advice">
          <p>Information provided by ScanDevice does not constitute legal, cybersecurity, or privacy advice. For matters requiring professional assessment, please consult a qualified expert.</p>
        </Section>

        <Section title="Third-Party Data">
          <p>IP geolocation results are sourced from third-party providers (ipapi.co). ScanDevice does not guarantee the accuracy of geolocation data and is not responsible for errors in third-party datasets.</p>
        </Section>

        <Section title="No Affiliation">
          <p>ScanDevice is an independent tool and is not affiliated with, endorsed by, or in partnership with any browser vendor (Google, Mozilla, Apple, Microsoft), ISP, or government body.</p>
        </Section>

        <Section title="Use at Your Own Risk">
          <p>By using ScanDevice, you acknowledge that you are using the Service at your own risk. ScanDevice disclaims all liability for decisions made based on the results provided by this tool.</p>
        </Section>

        <Section title="Specialist Developer Tool">
          <p>This tool was built by a developer for developers, researchers, and technically informed users who understand the nature of browser fingerprinting. Results require informed interpretation in context.</p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
