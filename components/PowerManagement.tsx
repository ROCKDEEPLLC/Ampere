// ============================================================================
// AMPERE POWER MANAGEMENT SYSTEM
// File: components/PowerManagement.tsx
// Phase 2 Feature Implementation
//
// This component implements:
// - Power Off function (Request #14)
// - Archive feature (Request #15)
// - Power On boot experience (Request #7)
//
// Includes:
// - Power menu with options
// - Archive/watched content management
// - Boot animation sequence
// - TV power control (when connected)
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { SmartImage } from "./SmartImage";
import { powerIconCandidates, brandWideCandidates } from "../lib/assetPath";

// ============================================================================
// TYPES
// ============================================================================

export interface PowerState {
  isPoweredOn: boolean;
  isBooting: boolean;
  bootProgress: number;
  tvConnected: boolean;
  tvPoweredOn: boolean;
}

export interface ArchivedItem {
  id: string;
  title: string;
  platformId: string;
  platformName: string;
  archivedAt: string;
  watchedAt?: string;
  progress?: number; // 0-100
}

// ============================================================================
// POWER MENU COMPONENT
// ============================================================================

export function PowerMenu({
  isOpen,
  onClose,
  onPowerOff,
  onRestart,
  onSleep,
  onTVPowerOff,
  tvConnected = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPowerOff: () => void;
  onRestart: () => void;
  onSleep: () => void;
  onTVPowerOff?: () => void;
  tvConnected?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="power-menu-backdrop" onClick={onClose} />

      {/* Menu */}
      <div className="power-menu">
        <h3 className="power-menu-title">Power Options</h3>

        <div className="power-menu-items">
          <button className="power-menu-item" onClick={onSleep}>
            <div className="power-menu-icon">🌙</div>
            <div>
              <div className="power-menu-label">Sleep</div>
              <div className="power-menu-description">Low power standby mode</div>
            </div>
          </button>

          <button className="power-menu-item" onClick={onRestart}>
            <div className="power-menu-icon">🔄</div>
            <div>
              <div className="power-menu-label">Restart App</div>
              <div className="power-menu-description">Reload the application</div>
            </div>
          </button>

          {tvConnected && onTVPowerOff && (
            <button className="power-menu-item" onClick={onTVPowerOff}>
              <div className="power-menu-icon">📺</div>
              <div>
                <div className="power-menu-label">Power Off TV</div>
                <div className="power-menu-description">Turn off connected TV</div>
              </div>
            </button>
          )}

          <div className="power-menu-divider" />

          <button className="power-menu-item danger" onClick={onPowerOff}>
            <div className="power-menu-icon">⏻</div>
            <div>
              <div className="power-menu-label">Power Off</div>
              <div className="power-menu-description">Shut down the app</div>
            </div>
          </button>
        </div>
      </div>

      <style jsx>{`
        .power-menu-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          z-index: 1900;
        }

        .power-menu {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--panel-strong);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius);
          box-shadow: 0 32px 80px rgba(0, 0, 0, 0.7);
          min-width: 320px;
          z-index: 2000;
          padding: 20px;
        }

        .power-menu-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .power-menu-items {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .power-menu-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .power-menu-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .power-menu-item.danger:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .power-menu-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .power-menu-label {
          font-weight: 600;
          margin-bottom: 2px;
        }

        .power-menu-description {
          font-size: 13px;
          color: var(--muted2);
        }

        .power-menu-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 8px 0;
        }

        @media (max-width: 640px) {
          .power-menu {
            min-width: 280px;
          }
        }
      `}</style>
    </>
  );
}

// ============================================================================
// POWER BUTTON COMPONENT
// ============================================================================

export function PowerButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="power-button" title="Power Options">
      <SmartImage
        candidates={powerIconCandidates()}
        alt="Power"
        cacheKey="power-icon"
        fallbackType="icon"
      />

      <style jsx>{`
        .power-button {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--panel-border);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .power-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </button>
  );
}

// ============================================================================
// BOOT ANIMATION COMPONENT (Request #7)
// ============================================================================

export function BootAnimation({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"logo" | "loading" | "fadeout">("logo");

  useEffect(() => {
    // Logo stage (1 second)
    const logoTimer = setTimeout(() => {
      setStage("loading");
    }, 1000);

    // Loading progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setStage("fadeout");
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    return () => {
      clearTimeout(logoTimer);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className={`boot-screen ${stage}`}>
      <div className="boot-content">
        {/* Logo */}
        <div className="boot-logo">
          <SmartImage
            candidates={brandWideCandidates()}
            alt="Ampere"
            cacheKey="brand-wide"
            className="logo-image"
          />
        </div>

        {/* Loading indicator */}
        {stage !== "logo" && (
          <div className="boot-loading">
            <div className="boot-progress-bar">
              <div
                className="boot-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="boot-text">Starting up...</div>
          </div>
        )}
      </div>

      <style jsx>{`
        .boot-screen {
          position: fixed;
          inset: 0;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.5s ease;
        }

        .boot-screen.fadeout {
          animation: fadeOut 0.5s ease forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        .boot-content {
          text-align: center;
        }

        .boot-logo {
          margin-bottom: 40px;
          animation: logoGlow 2s ease infinite;
        }

        @keyframes logoGlow {
          0%, 100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.2);
          }
        }

        .boot-logo :global(.logo-image) {
          max-width: 300px;
          height: auto;
        }

        .boot-loading {
          margin-top: 20px;
        }

        .boot-progress-bar {
          width: 300px;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin: 0 auto 12px;
        }

        .boot-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--blue), rgba(139, 92, 246, 0.95));
          transition: width 0.1s linear;
        }

        .boot-text {
          font-size: 14px;
          color: var(--muted);
        }

        @media (max-width: 640px) {
          .boot-logo :global(.logo-image) {
            max-width: 200px;
          }

          .boot-progress-bar {
            width: 200px;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// ARCHIVE MANAGEMENT COMPONENT (Request #15)
// ============================================================================

export function ArchiveManager({
  items,
  onRestore,
  onDelete,
  onClose,
}: {
  items: ArchivedItem[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "watched" | "unwatched">("all");

  const filteredItems = items.filter((item) => {
    if (filter === "watched") return item.watchedAt;
    if (filter === "unwatched") return !item.watchedAt;
    return true;
  });

  return (
    <div className="archive-overlay">
      <div className="archive-container">
        {/* Header */}
        <div className="archive-header">
          <h2>Archive</h2>
          <button onClick={onClose} className="close-button">
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="archive-filters">
          <button
            onClick={() => setFilter("all")}
            className={`filter-button ${filter === "all" ? "active" : ""}`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilter("watched")}
            className={`filter-button ${filter === "watched" ? "active" : ""}`}
          >
            Watched ({items.filter((i) => i.watchedAt).length})
          </button>
          <button
            onClick={() => setFilter("unwatched")}
            className={`filter-button ${filter === "unwatched" ? "active" : ""}`}
          >
            Unwatched ({items.filter((i) => !i.watchedAt).length})
          </button>
        </div>

        {/* Items */}
        <div className="archive-items">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No archived items</h3>
              <p>Items you archive will appear here</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="archive-item">
                <div className="archive-item-info">
                  <h4>{item.title}</h4>
                  <p className="archive-platform">{item.platformName}</p>
                  {item.progress !== undefined && (
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                  <p className="archive-date">
                    Archived {new Date(item.archivedAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="archive-item-actions">
                  <button
                    onClick={() => onRestore(item.id)}
                    className="action-button"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="action-button danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .archive-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .archive-container {
          background: var(--panel-strong);
          border: 1px solid var(--panel-border);
          border-radius: var(--radius);
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .archive-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          border-bottom: 1px solid var(--panel-border);
        }

        .archive-header h2 {
          font-size: 22px;
          font-weight: 800;
        }

        .close-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--panel-border);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .archive-filters {
          display: flex;
          gap: 8px;
          padding: 16px 24px;
          border-bottom: 1px solid var(--panel-border);
        }

        .filter-button {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--panel-border);
          border-radius: 999px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-button:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .filter-button.active {
          background: var(--blue);
          border-color: var(--blue);
          color: white;
        }

        .archive-items {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .empty-state p {
          color: var(--muted);
        }

        .archive-item {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .archive-item-info h4 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .archive-platform {
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 8px;
        }

        .progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: var(--blue);
        }

        .archive-date {
          font-size: 12px;
          color: var(--muted2);
        }

        .archive-item-actions {
          display: flex;
          gap: 8px;
        }

        .action-button {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--panel-border);
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .action-button:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .action-button.danger:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
        }

        @media (max-width: 640px) {
          .archive-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .archive-item-actions {
            width: 100%;
          }

          .action-button {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// POWER MANAGEMENT HOOK
// ============================================================================

export function usePowerManagement() {
  const [powerState, setPowerState] = useState<PowerState>({
    isPoweredOn: false,
    isBooting: true,
    bootProgress: 0,
    tvConnected: false,
    tvPoweredOn: false,
  });

  const handlePowerOff = () => {
    setPowerState((prev) => ({ ...prev, isPoweredOn: false }));
    // Optionally: Clear session, save state, etc.
  };

  const handleRestart = () => {
    setPowerState({
      isPoweredOn: true,
      isBooting: true,
      bootProgress: 0,
      tvConnected: powerState.tvConnected,
      tvPoweredOn: powerState.tvPoweredOn,
    });
  };

  const handleSleep = () => {
    // Implement sleep mode logic
    console.log("Entering sleep mode");
  };

  const handleBootComplete = () => {
    setPowerState((prev) => ({
      ...prev,
      isBooting: false,
      isPoweredOn: true,
      bootProgress: 100,
    }));
  };

  return {
    powerState,
    handlePowerOff,
    handleRestart,
    handleSleep,
    handleBootComplete,
  };
}
