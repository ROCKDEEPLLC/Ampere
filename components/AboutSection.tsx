import React, { useState } from 'react';

interface AboutSectionProps {
  onClose: () => void;
}

type SectionId =
  | 'backstory'
  | 'people'
  | 'problem'
  | 'solution'
  | 'features'
  | 'architecture'
  | 'build';

const NAV_ITEMS: { id: SectionId; label: string }[] = [
  { id: 'backstory', label: 'AMP\u00c8RE Backstory' },
  { id: 'people', label: 'Important People To Know' },
  { id: 'problem', label: 'Core Problem Statement' },
  { id: 'solution', label: 'Solution' },
  { id: 'features', label: 'Key Features' },
  { id: 'architecture', label: 'Technical Architecture' },
  { id: 'build', label: 'Build / Version' },
];

export function AboutSection({ onClose }: AboutSectionProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('backstory');
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 9998,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '94%',
          maxWidth: '960px',
          maxHeight: '90vh',
          background: 'rgba(12, 12, 14, 0.98)',
          border: '1px solid rgba(58,167,255,0.15)',
          borderRadius: '18px',
          boxShadow: '0 0 40px rgba(58,167,255,0.08), 0 24px 80px rgba(0,0,0,0.6)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top bar */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #3aa7ff 0%, #60c0ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            About AMP&#200;RE
          </h1>
          <button
            onClick={onClose}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            &#215;
          </button>
        </div>

        {/* Body = sidebar + content */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Sidebar nav */}
          <nav style={{
            width: collapsed ? '48px' : '210px',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255,255,255,0.02)',
            transition: 'width 0.2s ease',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                whiteSpace: 'nowrap',
              }}
            >
              {collapsed ? '\u25b6' : '\u25c0 Collapse'}
            </button>
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: collapsed ? '10px 14px' : '10px 16px',
                    background: activeSection === item.id
                      ? 'rgba(58,167,255,0.12)'
                      : 'transparent',
                    border: 'none',
                    borderLeft: activeSection === item.id
                      ? '3px solid #3aa7ff'
                      : '3px solid transparent',
                    color: activeSection === item.id ? 'white' : 'rgba(255,255,255,0.55)',
                    fontSize: '13px',
                    fontWeight: activeSection === item.id ? 800 : 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transition: 'all 0.15s',
                  }}
                  title={item.label}
                >
                  {collapsed ? item.label.charAt(0) : item.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 32px',
            lineHeight: 1.75,
            fontSize: '14px',
            color: 'rgba(255,255,255,0.88)',
          }}>
            {activeSection === 'backstory' && <BackstoryContent />}
            {activeSection === 'people' && <PeopleContent />}
            {activeSection === 'problem' && <ProblemContent />}
            {activeSection === 'solution' && <SolutionContent />}
            {activeSection === 'features' && <FeaturesContent />}
            {activeSection === 'architecture' && <ArchitectureContent />}
            {activeSection === 'build' && <BuildContent />}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
            AMP&#200;RE v1.0.0 &middot; Build 2026.02
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '8px 28px',
              background: 'linear-gradient(135deg, #3aa7ff 0%, #2b8ae0 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Section Heading ─── */
function SH({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: '17px',
      fontWeight: 900,
      marginTop: '24px',
      marginBottom: '10px',
      letterSpacing: '-0.01em',
    }}>
      {children}
    </h2>
  );
}

/* ─── Blue callout box ─── */
function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '14px 18px',
      background: 'rgba(58,167,255,0.08)',
      borderLeft: '3px solid #3aa7ff',
      borderRadius: '6px',
      marginBottom: '18px',
      fontSize: '13px',
    }}>
      {children}
    </div>
  );
}

/* ─── Bullet list ─── */
function BL({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyleType: 'disc' }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: '5px' }}>{item}</li>
      ))}
    </ul>
  );
}

/* ═══════════════════════════════════════════════════════
   1. BACKSTORY
   ═══════════════════════════════════════════════════════ */
function BackstoryContent() {
  return (
    <div>
      <SH>The Name &amp; Its Origin</SH>
      <p style={{ marginBottom: '14px' }}>
        <strong>AMP&#200;RE</strong> is named after <strong>Andr&#233;-Marie Amp&#232;re</strong> (1775{'\u2013'}1836),
        the French physicist who discovered the fundamental laws of electromagnetism and proved that
        electric current can control force at a distance.
      </p>
      <Callout>
        <strong>The ampere (amp)</strong> {'\u2014'} the SI unit of electric current {'\u2014'} is named after him.
        Without Amp&#232;re, remote control as a concept does not exist.
      </Callout>

      <SH>What Amp&#232;re Discovered</SH>
      <BL items={[
        'Discovered the mathematical relationship between electric current and magnetic fields',
        'Proved that electric current can control force at a distance',
        'Laid the groundwork for electric signals, wireless control, and modern electronics',
        'Made remote activation of systems theoretically possible',
      ]} />

      <SH>Why This Matters for Streaming</SH>
      <p style={{ marginBottom: '14px' }}>
        The modern streaming remote control is the descendant of Amp&#232;re{'\u2019'}s discovery. Every time you
        press a button on a remote {'\u2014'} whether IR, Bluetooth, or Wi-Fi {'\u2014'} you are using the principle
        that current can produce controlled action at a distance.
      </p>
      <p style={{ marginBottom: '14px' }}>
        <strong>AMP&#200;RE</strong> (the product) takes this a step further: instead of controlling one device,
        you control your entire streaming ecosystem {'\u2014'} every service, every channel, every preference {'\u2014'}
        from a single, intelligent interface.
      </p>

      <div style={{
        marginTop: '20px',
        padding: '18px',
        background: 'rgba(58,167,255,0.06)',
        borderRadius: '10px',
        border: '1px solid rgba(58,167,255,0.15)',
        textAlign: 'center',
        fontStyle: 'italic',
        fontSize: '15px',
      }}>
        <strong>AMP&#200;RE</strong> = the invisible current that turns <em>intention into action.</em>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   2. IMPORTANT PEOPLE TO KNOW
   ═══════════════════════════════════════════════════════ */
function PersonCard({
  name, years, title, layer, contributions, descendants, whyItMatters,
}: {
  name: string; years: string; title: string; layer: string;
  contributions: string[]; descendants: string[]; whyItMatters: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{
      marginBottom: '16px',
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '14px 18px',
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
        }}
      >
        <div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#3aa7ff', fontWeight: 700, marginBottom: '3px' }}>
            {layer}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800 }}>{name}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{years} &mdash; {title}</div>
        </div>
        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>{open ? '\u25b2' : '\u25bc'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 18px 16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Contributions:</div>
          <BL items={contributions} />
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Modern Descendants:</div>
          <BL items={descendants} />
          <Callout><strong>Why it matters:</strong> {whyItMatters}</Callout>
        </div>
      )}
    </div>
  );
}

function PeopleContent() {
  return (
    <div>
      <p style={{ marginBottom: '18px', color: 'rgba(255,255,255,0.65)' }}>
        The scientists and inventors who made remote control, wireless communication, and smart
        devices possible {'\u2014'} and the part they played in the modern tech stack.
      </p>

      <PersonCard
        name="Granville T. Woods"
        years="1856\u20131910"
        title="Scientist & Inventor"
        layer="Wireless Communication & Signaling Layer"
        contributions={[
          'Invented the multiplex telegraph \u2014 wireless signaling between moving trains',
          'Patented the induction telegraph for communication without wires',
          'Solved collision avoidance via real-time communication',
        ]}
        descendants={[
          'Wireless telemetry', 'Radio-based control systems',
          'Vehicle-to-infrastructure (V2I) communication',
          'Foundations of remote signaling logic used in streaming protocols',
        ]}
        whyItMatters="Remote control requires reliable signal transmission and interpretation. Woods solved that problem in hostile, moving environments \u2014 decades before Wi-Fi."
      />

      <PersonCard
        name="Garrett Morgan"
        years="1877\u20131963"
        title="Inventor"
        layer="Control Systems & Automation Layer"
        contributions={[
          'Invented the three-position traffic signal (stop / caution / go)',
          'Introduced multi-state automated control logic',
          'Created the safety hood (precursor to the gas mask)',
        ]}
        descendants={[
          'Control logic in remote controls (play / pause / stop)',
          'State machines in software', 'Automation rules in smart devices',
          'Traffic systems used worldwide',
        ]}
        whyItMatters="Remote control is meaningless without structured control logic. Morgan gave the world the concept of automated, multi-state system behavior."
      />

      <PersonCard
        name="Marie Van Brittan Brown"
        years="1922\u20131999"
        title="Inventor"
        layer="Remote Monitoring & Actuation (Smart Home Core)"
        contributions={[
          'Invented the first home security system (1966)',
          'Built remote video monitoring via closed-circuit TV',
          'Created remote door unlocking from a control panel',
          'Integrated two-way communication into the system',
        ]}
        descendants={[
          'Ring / Nest smart doorbells', 'Home security apps',
          'Remote access systems', 'Smartphone-controlled smart homes',
        ]}
        whyItMatters={'She built functional remote control of a physical system \u2014 decades before \u201cIoT\u201d existed. Her patent is the direct ancestor of every smart home device.'}
      />

      <PersonCard
        name="Otis Boykin"
        years="1920\u20131982"
        title="Scientist & Inventor"
        layer="Electronic Control Components"
        contributions={[
          'Invented precision wire resistors used in electronics worldwide',
          'Developed components for guided missiles, computers, and pacemakers',
          'Solved the problem of predictable electrical control at scale',
        ]}
        descendants={[
          'Signal regulation in remote controls', 'Power management in wireless devices',
          'Medical device electronics (pacemakers)',
          'Aerospace and military control electronics',
        ]}
        whyItMatters="Remote systems fail without stable, predictable control components. Boykin\u2019s resistors are in virtually every electronic device ever made."
      />

      {/* Stack Summary */}
      <SH>Technology Stack Summary</SH>
      <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
              {['Layer', 'Contributor', 'Contribution'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Wireless Signaling', 'Granville T. Woods', 'Moving wireless communication'],
              ['Control Logic', 'Garrett Morgan', 'Automated multi-state control'],
              ['Remote Systems', 'Marie Van Brittan Brown', 'Remote monitoring & actuation'],
              ['Electronics', 'Otis Boykin', 'Precision control components'],
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.75)' }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   3. CORE PROBLEM STATEMENT
   ═══════════════════════════════════════════════════════ */
function ProblemContent() {
  return (
    <div>
      <SH>The Streaming Fragmentation Problem</SH>
      <p style={{ marginBottom: '14px' }}>
        The average US household subscribes to <strong>4.7 streaming services</strong>, and power users may have
        8{'\u2013'}12+. Each service has its own app, its own UI, its own remote behavior, and its own search.
      </p>
      <BL items={[
        'No unified way to browse content across all services',
        'No single remote that controls every platform intelligently',
        'Switching between apps requires navigating multiple menus',
        'Favorite teams, leagues, and channels are scattered across services',
        'Family members each have different preferences with no shared control layer',
        'Voice commands are locked to individual ecosystems (Alexa, Siri, Google)',
      ]} />

      <SH>The Remote Control Problem</SH>
      <p style={{ marginBottom: '14px' }}>
        Physical remotes are outdated. They were designed for cable TV with 500 channels, not for
        an ecosystem of 80+ streaming platforms, live sports across 6 apps, and personalized recommendations.
      </p>
      <Callout>
        <strong>The core insight:</strong> The remote control hasn{'\u2019'}t evolved, but the content landscape has exploded.
        AMP&#200;RE bridges that gap.
      </Callout>

      <SH>Who This Affects</SH>
      <BL items={[
        'Cord-cutters who replaced cable but now juggle multiple apps',
        'Sports fans tracking teams across ESPN+, Peacock, Prime, DAZN, etc.',
        'Families where parents, kids, and teens all have different content needs',
        'Tech-savvy users who want a unified, customizable experience',
        'HBCU and community-specific audiences underserved by mainstream platforms',
      ]} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   4. SOLUTION
   ═══════════════════════════════════════════════════════ */
function SolutionContent() {
  return (
    <div>
      <SH>AMP&#200;RE: Choice &amp; Control {'\u2013'} Simplified</SH>
      <p style={{ marginBottom: '14px' }}>
        AMP&#200;RE is a <strong>universal streaming remote control</strong> that aggregates every service,
        channel, league, and preference into a single intelligent interface.
      </p>

      <SH>What AMP&#200;RE Does</SH>
      <BL items={[
        'Aggregates 80+ streaming platforms into one browsable catalog',
        'Provides genre-based and platform-based content discovery',
        'Lets users follow specific teams and leagues with live game alerts',
        'Offers per-profile customization (favorites, themes, preferences)',
        'Supports voice control for hands-free navigation',
        'Connects to physical TVs via TV Connect (CEC/eARC/vendor APIs)',
        'Works on mobile, tablet, and desktop with responsive design',
      ]} />

      <SH>How It Works</SH>
      <div style={{ display: 'grid', gap: '10px', marginBottom: '18px' }}>
        {[
          { step: '1', title: 'Setup Wizard', desc: 'Choose your platforms, genres, leagues, and teams' },
          { step: '2', title: 'Personalized Home', desc: 'See only content from services you care about' },
          { step: '3', title: 'Browse & Discover', desc: 'Filter by genre, search across all platforms, explore channels' },
          { step: '4', title: 'Watch', desc: 'Tap to open content in the native app or connected TV' },
          { step: '5', title: 'Control', desc: 'Power on/off, volume, input switching \u2014 all from AMP\u00c8RE' },
        ].map((s) => (
          <div key={s.step} style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            padding: '10px 14px',
            background: 'rgba(255,255,255,0.025)',
            borderRadius: '8px',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'rgba(58,167,255,0.15)', color: '#3aa7ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '13px', flexShrink: 0,
            }}>{s.step}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '13px' }}>{s.title}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <Callout>
        AMP&#200;RE doesn{'\u2019'}t replace your streaming apps {'\u2014'} it <strong>organizes and controls</strong> them.
        Think of it as the operating system layer that sits on top of your entire streaming stack.
      </Callout>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   5. KEY FEATURES
   ═══════════════════════════════════════════════════════ */
function FeaturesContent() {
  const features: { title: string; desc: string }[] = [
    { title: '80+ Streaming Platforms', desc: 'Netflix, Hulu, Disney+, ESPN+, Crunchyroll, BET+, HBCUGO, and dozens more \u2014 all in one catalog.' },
    { title: '15 Genre Categories', desc: 'Basic, Premium, Movies, Sports, Kids, Anime, Black Media, Gaming, Horror, LGBT, Free, and more.' },
    { title: 'Live Sports Tracking', desc: 'Follow NFL, NBA, MLB, NHL, MLS, NCAA, Premier League, UFC, IFL, and HBCU teams with live alerts.' },
    { title: 'Voice Commands', desc: 'Hands-free control: "Show me NBA games", "Open Netflix", "Turn off TV".' },
    { title: 'Per-Profile Customization', desc: 'Each family member gets their own favorites, theme, and preferences.' },
    { title: 'Setup Wizard', desc: '5-step guided setup: platforms, genres, leagues, teams, and review.' },
    { title: 'TV Connect', desc: 'Pair with Samsung, LG, Sony, Hisense, and more for direct TV control.' },
    { title: 'App Store', desc: 'Discover new services organized by category \u2014 from live TV to music to education.' },
    { title: 'Channel Previews', desc: 'See what\u2019s playing before you switch \u2014 live preview cards for every platform.' },
    { title: 'QWERTY Search', desc: 'Full on-screen keyboard for fast content and platform search.' },
    { title: 'Power Management', desc: 'Power On with boot animation, Power Off, and connected TV control.' },
    { title: 'Responsive Design', desc: 'Optimized for mobile, tablet, and desktop with proportionate pill buttons.' },
  ];

  return (
    <div>
      <SH>Feature Overview</SH>
      <div style={{ display: 'grid', gap: '10px' }}>
        {features.map((f, i) => (
          <div key={i} style={{
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '10px',
          }}>
            <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '3px' }}>{f.title}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   6. TECHNICAL ARCHITECTURE
   ═══════════════════════════════════════════════════════ */
function ArchitectureContent() {
  return (
    <div>
      <SH>System Architecture</SH>
      <BL items={[
        'Next.js 16 + React + TypeScript frontend',
        'Single-page prototype at /prototype with full client-side state',
        'LocalStorage persistence for profiles and preferences',
        'SmartImg component with multi-candidate asset resolution',
        'Web Speech API for voice command processing',
        'Responsive CSS with mobile-first breakpoints (640px / 1024px)',
      ]} />

      <SH>TV Connect Architecture</SH>
      <p style={{ marginBottom: '12px' }}>
        TV Connect enables AMP&#200;RE to communicate with physical smart TVs:
      </p>
      <BL items={[
        'mDNS / SSDP for local network device discovery',
        'CEC (Consumer Electronics Control) over HDMI for power and input',
        'eARC passthrough for audio control',
        'Vendor-specific APIs: Samsung Tizen, LG webOS, Roku ECP, Fire TV ADB',
        'Plan tiers: Basic (1 TV), Pro (3 TVs + voice), Family (5 profiles + 5 TVs)',
      ]} />

      <SH>Data Architecture</SH>
      <BL items={[
        'catalog.ts: 80+ platforms, 15 genres, 16 leagues, 400+ teams',
        'assetPath.ts: Multi-directory, multi-extension asset resolution with known-file mappings',
        'intent.ts: Voice command intent parser (NLU-lite)',
        'Profile state: favorites, leagues, teams, avatar, theme stored in localStorage',
      ]} />

      <SH>Asset Resolution Pipeline</SH>
      <p style={{ marginBottom: '12px' }}>
        The SmartImg component tries multiple candidate paths for each image:
      </p>
      <div style={{
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '11px',
        lineHeight: 1.8,
        marginBottom: '16px',
        color: 'rgba(255,255,255,0.7)',
      }}>
        1. KNOWN_SERVICE_FILES exact match<br />
        2. Generated filename variants (lowercase, hyphen, underscore, plus)<br />
        3. Multiple directory roots (/assets/services/, /logos/, /platforms/)<br />
        4. Multiple extensions (.png, .svg, .webp, .jpg)<br />
        5. First successful load wins; result cached
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   7. BUILD / VERSION
   ═══════════════════════════════════════════════════════ */
function BuildContent() {
  return (
    <div>
      <SH>Build Information</SH>
      <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
        {[
          ['Product', 'AMP\u00c8RE'],
          ['Version', '1.0.0'],
          ['Build', '2026.02'],
          ['Framework', 'Next.js 16.1.6 + React 19'],
          ['Language', 'TypeScript (strict)'],
          ['Platform', 'Web (PWA-ready)'],
          ['Deployment', 'Vercel'],
          ['Repository', 'ROCKDEEPLLC/Ampere'],
        ].map(([key, value]) => (
          <div key={key} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 14px',
            background: 'rgba(255,255,255,0.025)',
            borderRadius: '6px',
            fontSize: '13px',
          }}>
            <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{key}</span>
            <span style={{ fontWeight: 600 }}>{value}</span>
          </div>
        ))}
      </div>

      <SH>Changelog</SH>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
        <p><strong>v1.0.0</strong> (Feb 2026)</p>
        <BL items={[
          'Initial prototype release',
          '80+ streaming platforms cataloged',
          '15 genre categories with filtered browsing',
          '16 leagues, 400+ teams with live sports tracking',
          'Voice command support via Web Speech API',
          'Setup Wizard with 5-step guided onboarding',
          'TV Connect plans (Basic / Pro / Family)',
          'Channel preview cards for all major platforms',
          'QWERTY on-screen keyboard for search',
          'Responsive mobile/tablet/desktop layout',
          'HBCU sports and Black Media genre support',
          'About section with inventor backstories',
        ]} />
      </div>
    </div>
  );
}
