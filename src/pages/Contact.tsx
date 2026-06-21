import { useState } from 'react';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { Mail, MessageSquare, Bug, HelpCircle } from 'lucide-react';

const TOPICS = [
  { icon: <Bug size={16} />, label: 'Bug Report' },
  { icon: <HelpCircle size={16} />, label: 'General Question' },
  { icon: <MessageSquare size={16} />, label: 'Feature Request' },
  { icon: <Mail size={16} />, label: 'Other' },
];

export default function Contact() {
  const [topic, setTopic] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`[ScanDevice] ${topic || 'Contact'} — from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${msg}`);
    window.open(`mailto:hello@scandevice.online?subject=${subject}&body=${body}`);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#00d46a' }}>Contact</div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3" style={{ letterSpacing: '-0.03em' }}>Get in Touch</h1>
          <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Have a question, found a bug, or want to request a feature? We'd like to hear from you.
          </p>
        </div>

        {sent ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(0,212,106,0.07)', border: '1px solid rgba(0,212,106,0.2)' }}
          >
            <div className="text-3xl mb-3">📬</div>
            <div className="text-lg font-bold text-white mb-2">Message ready to send</div>
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Your email client should have opened. If not, email us directly at{' '}
              <a href="mailto:hello@scandevice.online" className="underline" style={{ color: '#00d46a' }}>hello@scandevice.online</a>
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl p-6 sm:p-8 space-y-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* Topic */}
            <div>
              <label className="block text-[12px] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Topic</label>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map(t => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setTopic(t.label)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all"
                    style={{
                      background: topic === t.label ? 'rgba(0,212,106,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${topic === t.label ? 'rgba(0,212,106,0.35)' : 'rgba(255,255,255,0.08)'}`,
                      color: topic === t.label ? '#00d46a' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-[12px] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-xl text-[13px] text-white outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', caretColor: '#00d46a' }}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[12px] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl text-[13px] text-white outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', caretColor: '#00d46a' }}
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-[12px] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Message</label>
              <textarea
                required
                rows={5}
                value={msg}
                onChange={e => setMsg(e.target.value)}
                placeholder="Describe your question or feedback..."
                className="w-full px-4 py-3 rounded-xl text-[13px] text-white outline-none resize-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', caretColor: '#00d46a' }}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-[14px] font-bold transition-all hover:opacity-90 active:scale-[0.99]"
              style={{ background: '#00d46a', color: '#000' }}
            >
              Send Message
            </button>
          </form>
        )}

        <p className="text-center text-[12px] mt-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Or email directly: <a href="mailto:hello@scandevice.online" className="underline" style={{ color: 'rgba(255,255,255,0.4)' }}>hello@scandevice.online</a>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
