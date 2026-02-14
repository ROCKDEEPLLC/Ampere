import React from 'react';

interface AboutSectionProps {
  onClose: () => void;
}

export function AboutSection({ onClose }: AboutSectionProps) {
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
          width: '90%',
          maxWidth: '600px',
          maxHeight: '85vh',
          background: 'rgba(15, 15, 15, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '40px',
          zIndex: 9999,
          overflowY: 'auto',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}
        >
          ×
        </button>

        {/* Title */}
        <h1 style={{
          fontSize: '36px',
          fontWeight: 700,
          marginBottom: '32px',
          textAlign: 'center',
        }}>
          The Backstory
        </h1>

        {/* Content */}
        <div style={{ lineHeight: 1.8, fontSize: '16px' }}>
          <p style={{ marginBottom: '24px' }}>
            <strong>Ampère</strong> is named after the force that made modern control possible – the invisible{' '}
            <em>current that turns intention into action.</em>
          </p>

          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 600, 
            marginTop: '32px',
            marginBottom: '16px'
          }}>
            Who Ampère Was
          </h2>

          <p style={{ marginBottom: '16px' }}>
            <strong>André-Marie Ampère</strong> (1775–1836) was the scientist who:
          </p>

          <ul style={{ 
            marginBottom: '24px', 
            paddingLeft: '24px',
            listStyleType: 'disc'
          }}>
            <li style={{ marginBottom: '12px' }}>
              Discovered the fundamental laws of electromagnetism
            </li>
            <li style={{ marginBottom: '12px' }}>
              Proved that electric current can control force at a distance
            </li>
            <li style={{ marginBottom: '12px' }}>
              Laid the groundwork for:
              <ul style={{ 
                marginTop: '8px',
                paddingLeft: '24px',
                listStyleType: 'circle'
              }}>
                <li style={{ marginBottom: '8px' }}>electric signals</li>
                <li style={{ marginBottom: '8px' }}>wireless control</li>
                <li style={{ marginBottom: '8px' }}>modern electronics</li>
                <li>remote activation of systems</li>
              </ul>
            </li>
          </ul>

          <p style={{ 
            marginBottom: '32px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderLeft: '3px solid var(--blue)',
            borderRadius: '4px'
          }}>
            <strong>The ampere (amp)</strong> — the unit of electric current — is named after him.
          </p>

          <p style={{ 
            fontSize: '18px',
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: '32px',
            padding: '24px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            Without <strong>Ampère</strong>, <em>remote control as a concept does not exist.</em>
          </p>

          {/* Version info */}
          <div style={{
            marginTop: '40px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>AMPÈRE v1.0.0</strong>
            </div>
            <div>
              Build 2026.02.13
            </div>
          </div>
        </div>

        {/* Close button at bottom */}
        <button
          onClick={onClose}
          style={{
            marginTop: '32px',
            width: '100%',
            padding: '14px',
            background: 'var(--blue)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--blue)'}
        >
          Close
        </button>
      </div>
    </>
  );
}
