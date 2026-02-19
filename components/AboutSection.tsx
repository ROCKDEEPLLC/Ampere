import React, { useState } from 'react';

interface AboutSectionProps {
  onClose: () => void;
}

type Tab = 'backstory' | 'inventors';

export function AboutSection({ onClose }: AboutSectionProps) {
  const [tab, setTab] = useState<Tab>('backstory');

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 9998,
        }}
      />

      {/* Modal */}
      <div
        className="modal"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '92%',
          maxWidth: '720px',
          maxHeight: '88vh',
          background: 'rgba(15, 15, 15, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header with tabs */}
        <div style={{
          padding: '24px 40px 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
        }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              zIndex: 1,
            }}
          >
            ×
          </button>

          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '20px', textAlign: 'center' }}>
            About AMPÈRE
          </h1>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: '0' }}>
            <button
              onClick={() => setTab('backstory')}
              style={{
                flex: 1,
                padding: '12px 0',
                background: 'none',
                border: 'none',
                borderBottom: tab === 'backstory' ? '2px solid var(--blue)' : '2px solid transparent',
                color: tab === 'backstory' ? 'white' : 'rgba(255,255,255,0.5)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              The Backstory
            </button>
            <button
              onClick={() => setTab('inventors')}
              style={{
                flex: 1,
                padding: '12px 0',
                background: 'none',
                border: 'none',
                borderBottom: tab === 'inventors' ? '2px solid var(--blue)' : '2px solid transparent',
                color: tab === 'inventors' ? 'white' : 'rgba(255,255,255,0.5)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Inventors & Scientists
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 40px',
        }}>
          {tab === 'backstory' ? <BackstoryTab /> : <InventorsTab />}
        </div>

        {/* Sticky footer */}
        <div style={{
          padding: '16px 40px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
        }}>
          {/* Version info */}
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.4)',
            textAlign: 'center',
            marginBottom: '12px',
          }}>
            <strong>AMPÈRE v1.0.0</strong> · Build 2026.02.13
          </div>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--blue)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
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

/* ─── Backstory Tab ─── */
function BackstoryTab() {
  return (
    <div style={{ lineHeight: 1.8, fontSize: '15px' }}>
      <p style={{ marginBottom: '20px' }}>
        <strong>Ampère</strong> is named after the force that made modern control possible — the invisible{' '}
        <em>current that turns intention into action.</em>
      </p>

      <SectionHeading>Who Ampère Was</SectionHeading>

      <p style={{ marginBottom: '12px' }}>
        <strong>André-Marie Ampère</strong> (1775–1836) was the scientist who:
      </p>

      <ul style={{ marginBottom: '20px', paddingLeft: '20px', listStyleType: 'disc' }}>
        <li style={{ marginBottom: '8px' }}>Discovered the fundamental laws of electromagnetism</li>
        <li style={{ marginBottom: '8px' }}>Proved that electric current can control force at a distance</li>
        <li style={{ marginBottom: '8px' }}>
          Laid the groundwork for:
          <ul style={{ marginTop: '6px', paddingLeft: '20px', listStyleType: 'circle' }}>
            <li style={{ marginBottom: '4px' }}>electric signals</li>
            <li style={{ marginBottom: '4px' }}>wireless control</li>
            <li style={{ marginBottom: '4px' }}>modern electronics</li>
            <li>remote activation of systems</li>
          </ul>
        </li>
      </ul>

      <Callout>
        <strong>The ampere (amp)</strong> — the unit of electric current — is named after him.
      </Callout>

      <div style={{
        fontSize: '16px',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: '28px',
        padding: '20px',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '8px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
      }}>
        Without <strong>Ampère</strong>, <em>remote control as a concept does not exist.</em>
      </div>

      {/* Image drop-in placeholder */}
      <div style={{
        marginTop: '28px',
        padding: '32px',
        border: '2px dashed rgba(255,255,255,0.1)',
        borderRadius: '12px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.3)',
        fontSize: '13px',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼</div>
        Image placeholder — drop historical images here
      </div>
    </div>
  );
}

/* ─── Inventors & Scientists Tab ─── */
function InventorsTab() {
  return (
    <div style={{ lineHeight: 1.7, fontSize: '14px' }}>
      <p style={{ marginBottom: '24px', color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>
        <strong>Other inventors & scientists you should know:</strong> The part they played in the modern tech stack
        <br />
        <em>(Wireless → Control → IoT / Smart Devices)</em>
      </p>

      {/* Granville T. Woods */}
      <InventorCard
        name="Granville T. Woods"
        years="1856–1910"
        title="Scientist & Inventor"
        layer="Wireless Communication & Signaling Layer"
        layerSub="Precursor to remote control, radio, IoT connectivity"
        role={[
          "Wireless signaling between moving objects (trains)",
          "Collision avoidance via communication",
        ]}
        descendants={[
          "Wireless telemetry",
          "Radio-based control systems",
          "Vehicle-to-infrastructure (V2I) communication",
          "Foundations of remote signaling logic",
        ]}
        whyItMatters="Remote control requires reliable signal transmission + interpretation. Woods solved that problem in hostile, moving environments."
      />

      {/* Garrett Morgan */}
      <InventorCard
        name="Garrett Morgan"
        years="1877–1963"
        title="Inventor"
        layer="Control Systems & Automation Layer"
        layerSub="Devices that change state without physical presence"
        role={[
          "Automated traffic control logic",
          "Multi-state system behavior (stop / warn / go)",
        ]}
        descendants={[
          "Control logic in remotes",
          "State machines in software",
          "Automation rules in smart devices",
        ]}
        whyItMatters="Remote control is meaningless without structured control logic."
      />

      {/* Marie Van Brittan Brown */}
      <InventorCard
        name="Marie Van Brittan Brown"
        years="1922–1999"
        title="Inventor"
        layer="Remote Monitoring & Actuation (Smart Home Core)"
        layerSub=""
        role={[
          "Remote video monitoring",
          "Remote door unlocking",
          "Two-way communication",
        ]}
        descendants={[
          "Smart doorbells",
          "Home security apps",
          "Remote access systems",
          "Smartphone-controlled homes",
        ]}
        whyItMatters={'She built functional remote control of a physical system, decades before \u201cIoT\u201d existed.'}
      />

      {/* Otis Boykin */}
      <InventorCard
        name="Otis Boykin"
        years="1920–1982"
        title="Scientist & Inventor"
        layer="Electronic Control Components"
        layerSub="Invisible but essential"
        role={[
          "Precision electrical control via resistors",
        ]}
        descendants={[
          "Signal regulation in remotes",
          "Power management in wireless devices",
          "Medical and aerospace control electronics",
        ]}
        whyItMatters="Remote systems fail without stable, predictable control components."
      />

      {/* Stack Summary Table */}
      <SectionHeading>Stack Summary</SectionHeading>
      <div style={{ overflowX: 'auto', marginBottom: '28px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
              <Th>Layer</Th><Th>Contributor</Th><Th>Contribution</Th>
            </tr>
          </thead>
          <tbody>
            <Tr cells={["Wireless signaling", "Granville T. Woods", "Moving wireless communication"]} />
            <Tr cells={["Control logic", "Garrett Morgan", "Automated multi-state control"]} />
            <Tr cells={["Remote systems", "Marie Van Brittan Brown", "Remote monitoring & actuation"]} />
            <Tr cells={["Electronics", "Otis Boykin", "Precision control components"]} />
          </tbody>
        </table>
      </div>

      {/* Timeline */}
      <SectionHeading>Timeline of Control & Wireless Technology</SectionHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <TimelineEntry era="1850s–1900s" name="Granville T. Woods" items={[
          "Wireless induction telegraph",
          "Train communication without physical contact → Foundation for wireless control & telemetry",
        ]} />
        <TimelineEntry era="1920s" name="Garrett Morgan" items={[
          "Automated traffic control systems → Control logic & safety automation",
        ]} />
        <TimelineEntry era="1950s–1960s" name="Otis Boykin" items={[
          "Precision resistors for control electronics → Reliability in remote & wireless systems",
        ]} />
        <TimelineEntry era="1966" name="Marie Van Brittan Brown" items={[
          "First home security system with: Remote video, Remote door control, Two-way audio → Direct ancestor of smart homes & app-based control",
        ]} />
      </div>

      <Callout>
        <strong>Resulting Impact (Today):</strong> Smart locks, Home cameras, Remote monitoring apps, Wireless automation systems
      </Callout>

      {/* Image drop-in placeholder */}
      <div style={{
        marginTop: '28px',
        padding: '32px',
        border: '2px dashed rgba(255,255,255,0.1)',
        borderRadius: '12px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.3)',
        fontSize: '13px',
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼</div>
        Image placeholder — drop inventor portraits here
      </div>
    </div>
  );
}

/* ─── Reusable Sub-components ─── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: '18px',
      fontWeight: 700,
      marginTop: '28px',
      marginBottom: '14px',
      color: 'white',
    }}>
      {children}
    </h2>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '16px 20px',
      background: 'rgba(255, 255, 255, 0.03)',
      borderLeft: '3px solid var(--blue)',
      borderRadius: '4px',
      marginBottom: '20px',
    }}>
      {children}
    </div>
  );
}

function InventorCard({
  name, years, title, layer, layerSub, role, descendants, whyItMatters,
}: {
  name: string; years: string; title: string; layer: string; layerSub: string;
  role: string[]; descendants: string[]; whyItMatters: string;
}) {
  return (
    <div style={{
      marginBottom: '24px',
      padding: '20px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
    }}>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--blue)', fontWeight: 700, marginBottom: '6px' }}>
        {layer}
      </div>
      {layerSub && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', fontStyle: 'italic' }}>{layerSub}</div>}
      <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '2px' }}>{name}</div>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '14px' }}>{years} — {title}</div>

      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'rgba(255,255,255,0.7)' }}>Role in the stack:</div>
      <ul style={{ paddingLeft: '18px', marginBottom: '12px', listStyleType: 'disc' }}>
        {role.map((r, i) => <li key={i} style={{ marginBottom: '3px' }}>{r}</li>)}
      </ul>

      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'rgba(255,255,255,0.7)' }}>Modern descendants:</div>
      <ul style={{ paddingLeft: '18px', marginBottom: '12px', listStyleType: 'disc' }}>
        {descendants.map((d, i) => <li key={i} style={{ marginBottom: '3px' }}>{d}</li>)}
      </ul>

      <div style={{
        padding: '10px 14px',
        background: 'rgba(59,130,246,0.08)',
        borderRadius: '6px',
        fontSize: '13px',
        fontStyle: 'italic',
      }}>
        <strong>Why it matters:</strong> {whyItMatters}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
      {children}
    </th>
  );
}

function Tr({ cells }: { cells: string[] }) {
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {cells.map((c, i) => (
        <td key={i} style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.8)' }}>{c}</td>
      ))}
    </tr>
  );
}

function TimelineEntry({ era, name, items }: { era: string; name: string; items: string[] }) {
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <div style={{
        minWidth: '90px',
        fontWeight: 800,
        fontSize: '13px',
        color: 'var(--blue)',
        paddingTop: '2px',
      }}>
        {era}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{name}</div>
        <ul style={{ paddingLeft: '16px', listStyleType: 'disc', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
          {items.map((item, i) => <li key={i} style={{ marginBottom: '3px' }}>{item}</li>)}
        </ul>
      </div>
    </div>
  );
}
