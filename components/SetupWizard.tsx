// ============================================================================
// AMPERE SETUP WIZARD - 5-STEP ONBOARDING
// File: components/SetupWizard.tsx
// Phase 2 Feature Implementation
//
// This component implements the full 5-step setup wizard with:
// - Step persistence (resume where user left off)
// - Profile state integration
// - Validation at each step
// - Progress tracking
// - Mobile responsive design
//
// REQUEST #12: Setup Wizard missing
// ADDITIONAL REQUEST P0: Wizard should resume where user left off
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { PLATFORMS, GENRES, platformsForGenre } from "../lib/catalog";
import { SmartImage } from "./SmartImage";
import { brandWideCandidates } from "../lib/assetPath";

// ============================================================================
// TYPES
// ============================================================================

export interface WizardState {
  step: 1 | 2 | 3 | 4 | 5;
  name: string;
  selectedPlatforms: string[];
  selectedGenres: string[];
  selectedLeagues: string[];
  selectedTeams: string[];
  profilePhoto: string | null;
  headerPhoto: string | null;
  completedAt: string | null;
  lastUpdated: string;
}

interface SetupWizardProps {
  /** Initial state (can be from localStorage) */
  initialState?: Partial<WizardState>;
  
  /** Called when wizard is completed */
  onComplete: (state: WizardState) => void;
  
  /** Called when user exits wizard */
  onExit?: () => void;
  
  /** Called on each step change (for persistence) */
  onStateChange?: (state: WizardState) => void;
}

// ============================================================================
// DEFAULT STATE
// ============================================================================

const DEFAULT_STATE: WizardState = {
  step: 1,
  name: "",
  selectedPlatforms: [],
  selectedGenres: [],
  selectedLeagues: [],
  selectedTeams: [],
  profilePhoto: null,
  headerPhoto: null,
  completedAt: null,
  lastUpdated: new Date().toISOString(),
};

// ============================================================================
// SPORTS LEAGUES DATA
// ============================================================================

const SPORTS_LEAGUES = [
  { id: "nfl", name: "NFL", category: "American Football" },
  { id: "nba", name: "NBA", category: "Basketball" },
  { id: "mlb", name: "MLB", category: "Baseball" },
  { id: "nhl", name: "NHL", category: "Hockey" },
  { id: "mls", name: "MLS", category: "Soccer" },
  { id: "epl", name: "Premier League", category: "Soccer" },
  { id: "laliga", name: "La Liga", category: "Soccer" },
  { id: "ucl", name: "Champions League", category: "Soccer" },
  { id: "ufc", name: "UFC", category: "MMA" },
  { id: "f1", name: "Formula 1", category: "Racing" },
  { id: "nascar", name: "NASCAR", category: "Racing" },
];

// ============================================================================
// SETUP WIZARD COMPONENT
// ============================================================================

export function SetupWizard({
  initialState = {},
  onComplete,
  onExit,
  onStateChange,
}: SetupWizardProps) {
  const [state, setState] = useState<WizardState>({
    ...DEFAULT_STATE,
    ...initialState,
  });

  // Persist state on change
  useEffect(() => {
    const updated = {
      ...state,
      lastUpdated: new Date().toISOString(),
    };
    setState(updated);
    onStateChange?.(updated);
  }, [state.step]);

  const updateState = (updates: Partial<WizardState>) => {
    const newState = { ...state, ...updates };
    setState(newState);
    onStateChange?.(newState);
  };

  const nextStep = () => {
    if (state.step < 5) {
      updateState({ step: (state.step + 1) as WizardState["step"] });
    }
  };

  const prevStep = () => {
    if (state.step > 1) {
      updateState({ step: (state.step - 1) as WizardState["step"] });
    }
  };

  const canProceed = () => {
    switch (state.step) {
      case 1: return state.name.trim().length >= 2;
      case 2: return state.selectedPlatforms.length >= 3;
      case 3: return state.selectedGenres.length >= 2;
      case 4: return true; // Sports is optional
      case 5: return true; // Photos are optional
      default: return false;
    }
  };

  const handleComplete = () => {
    const completedState = {
      ...state,
      completedAt: new Date().toISOString(),
    };
    setState(completedState);
    onComplete(completedState);
  };

  return (
    <div className="wizard-overlay">
      <div className="wizard-container">
        {/* Header */}
        <WizardHeader 
          step={state.step} 
          onExit={onExit}
        />

        {/* Progress Bar */}
        <ProgressBar currentStep={state.step} totalSteps={5} />

        {/* Step Content */}
        <div className="wizard-content">
          {state.step === 1 && (
            <Step1Welcome
              name={state.name}
              onChange={(name) => updateState({ name })}
            />
          )}

          {state.step === 2 && (
            <Step2Platforms
              selected={state.selectedPlatforms}
              onChange={(platforms) => updateState({ selectedPlatforms: platforms })}
            />
          )}

          {state.step === 3 && (
            <Step3Genres
              selected={state.selectedGenres}
              onChange={(genres) => updateState({ selectedGenres: genres })}
            />
          )}

          {state.step === 4 && (
            <Step4Sports
              selectedLeagues={state.selectedLeagues}
              selectedTeams={state.selectedTeams}
              onLeaguesChange={(leagues) => updateState({ selectedLeagues: leagues })}
              onTeamsChange={(teams) => updateState({ selectedTeams: teams })}
            />
          )}

          {state.step === 5 && (
            <Step5Photos
              profilePhoto={state.profilePhoto}
              headerPhoto={state.headerPhoto}
              onProfileChange={(photo) => updateState({ profilePhoto: photo })}
              onHeaderChange={(photo) => updateState({ headerPhoto: photo })}
            />
          )}
        </div>

        {/* Navigation */}
        <WizardFooter
          step={state.step}
          canProceed={canProceed()}
          onPrev={prevStep}
          onNext={nextStep}
          onComplete={handleComplete}
        />
      </div>

      <style jsx>{`
        .wizard-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .wizard-container {
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

        .wizard-content {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
        }

        @media (max-width: 640px) {
          .wizard-container {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }

          .wizard-content {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// WIZARD HEADER
// ============================================================================

function WizardHeader({ step, onExit }: { step: number; onExit?: () => void }) {
  return (
    <div className="wizard-header">
      <SmartImage
        candidates={brandWideCandidates()}
        alt="Ampere"
        className="wizard-logo"
        cacheKey="brand-wide"
      />
      <button onClick={onExit} className="wizard-close">
        ✕
      </button>

      <style jsx>{`
        .wizard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 32px;
          border-bottom: 1px solid var(--panel-border);
        }

        .wizard-logo {
          height: 32px;
          width: auto;
        }

        .wizard-close {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--panel-border);
          font-size: 20px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .wizard-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        @media (max-width: 640px) {
          .wizard-header {
            padding: 16px 20px;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

function ProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="progress-container">
      <div className="progress-bar" style={{ width: `${progress}%` }} />
      <div className="progress-text">
        Step {currentStep} of {totalSteps}
      </div>

      <style jsx>{`
        .progress-container {
          position: relative;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--blue), rgba(139, 92, 246, 0.95));
          transition: width 0.3s ease;
        }

        .progress-text {
          position: absolute;
          top: 12px;
          right: 32px;
          font-size: 12px;
          color: var(--muted);
        }

        @media (max-width: 640px) {
          .progress-text {
            right: 20px;
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// STEP 1: WELCOME / NAME
// ============================================================================

function Step1Welcome({ name, onChange }: { name: string; onChange: (name: string) => void }) {
  return (
    <div className="step-container">
      <h1 className="step-title">Welcome to Ampere! 👋</h1>
      <p className="step-description">
        Let's personalize your streaming experience. We'll help you connect your favorite platforms
        and discover content you'll love.
      </p>

      <div className="input-group">
        <label htmlFor="name">What should we call you?</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your name"
          autoFocus
          className="wizard-input"
        />
        {name.length > 0 && name.length < 2 && (
          <p className="input-hint error">Name must be at least 2 characters</p>
        )}
      </div>

      <style jsx>{`
        .step-container {
          max-width: 500px;
          margin: 0 auto;
        }

        .step-title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .step-description {
          color: var(--muted);
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .input-group {
          margin-bottom: 24px;
        }

        .input-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .wizard-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--panel-border);
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.2s;
        }

        .wizard-input:focus {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--blue);
          outline: none;
        }

        .input-hint {
          margin-top: 6px;
          font-size: 13px;
          color: var(--muted2);
        }

        .input-hint.error {
          color: #ef4444;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// STEP 2: PLATFORMS
// ============================================================================

function Step2Platforms({ 
  selected, 
  onChange 
}: { 
  selected: string[]; 
  onChange: (platforms: string[]) => void;
}) {
  const togglePlatform = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(p => p !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const popularPlatforms = PLATFORMS.filter(p => 
    ["netflix", "hulu", "primevideo", "disneyplus", "max", "youtube", "appletv", "peacock"].includes(p.id)
  );

  return (
    <div className="step-container">
      <h1 className="step-title">Choose Your Platforms</h1>
      <p className="step-description">
        Select at least 3 streaming services you use. You can add more later.
      </p>

      <div className="selection-count">
        {selected.length} selected {selected.length < 3 && `(${3 - selected.length} more needed)`}
      </div>

      <div className="platform-grid">
        {popularPlatforms.map(platform => (
          <button
            key={platform.id}
            onClick={() => togglePlatform(platform.id)}
            className={`platform-card ${selected.includes(platform.id) ? 'selected' : ''}`}
          >
            <div className="platform-check">
              {selected.includes(platform.id) && '✓'}
            </div>
            <div className="platform-name">{platform.label}</div>
          </button>
        ))}
      </div>

      <style jsx>{`
        .selection-count {
          margin-bottom: 20px;
          padding: 12px 16px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 10px;
          text-align: center;
          font-weight: 600;
        }

        .platform-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }

        .platform-card {
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid var(--panel-border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .platform-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }

        .platform-card.selected {
          background: rgba(59, 130, 246, 0.15);
          border-color: var(--blue);
        }

        .platform-check {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--blue);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .platform-card.selected .platform-check {
          opacity: 1;
        }

        .platform-name {
          font-weight: 600;
          text-align: center;
        }

        @media (max-width: 640px) {
          .platform-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// STEP 3: GENRES
// ============================================================================

function Step3Genres({ 
  selected, 
  onChange 
}: { 
  selected: string[]; 
  onChange: (genres: string[]) => void;
}) {
  const toggleGenre = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter(g => g !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  const genreList = GENRES.filter(g => g.key !== "All");

  return (
    <div className="step-container">
      <h1 className="step-title">What Do You Like to Watch?</h1>
      <p className="step-description">
        Select at least 2 genres you enjoy. This helps us recommend content.
      </p>

      <div className="selection-count">
        {selected.length} selected {selected.length < 2 && `(${2 - selected.length} more needed)`}
      </div>

      <div className="genre-list">
        {genreList.map(genre => (
          <button
            key={genre.key}
            onClick={() => toggleGenre(genre.key)}
            className={`genre-chip ${selected.includes(genre.key) ? 'selected' : ''}`}
          >
            {genre.key}
            {selected.includes(genre.key) && <span className="check">✓</span>}
          </button>
        ))}
      </div>

      <style jsx>{`
        .genre-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .genre-chip {
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid var(--panel-border);
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .genre-chip:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .genre-chip.selected {
          background: rgba(59, 130, 246, 0.15);
          border-color: var(--blue);
        }

        .check {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--blue);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// STEP 4: SPORTS (OPTIONAL)
// ============================================================================

function Step4Sports({
  selectedLeagues,
  selectedTeams,
  onLeaguesChange,
  onTeamsChange,
}: {
  selectedLeagues: string[];
  selectedTeams: string[];
  onLeaguesChange: (leagues: string[]) => void;
  onTeamsChange: (teams: string[]) => void;
}) {
  const toggleLeague = (id: string) => {
    if (selectedLeagues.includes(id)) {
      onLeaguesChange(selectedLeagues.filter(l => l !== id));
    } else {
      onLeaguesChange([...selectedLeagues, id]);
    }
  };

  return (
    <div className="step-container">
      <h1 className="step-title">Sports Fan? ⚽🏀</h1>
      <p className="step-description">
        Select your favorite leagues (optional). We'll help you find live games and highlights.
      </p>

      <div className="sports-grid">
        {SPORTS_LEAGUES.map(league => (
          <button
            key={league.id}
            onClick={() => toggleLeague(league.id)}
            className={`sport-card ${selectedLeagues.includes(league.id) ? 'selected' : ''}`}
          >
            <div className="sport-check">
              {selectedLeagues.includes(league.id) && '✓'}
            </div>
            <div className="sport-name">{league.name}</div>
            <div className="sport-category">{league.category}</div>
          </button>
        ))}
      </div>

      {selectedLeagues.length === 0 && (
        <p className="skip-hint">
          Not into sports? That's okay! Click "Next" to continue.
        </p>
      )}

      <style jsx>{`
        .sports-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
        }

        .sport-card {
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid var(--panel-border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          text-align: center;
        }

        .sport-card:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .sport-card.selected {
          background: rgba(59, 130, 246, 0.15);
          border-color: var(--blue);
        }

        .sport-check {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--blue);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          opacity: 0;
        }

        .sport-card.selected .sport-check {
          opacity: 1;
        }

        .sport-name {
          font-weight: 700;
          margin-bottom: 4px;
        }

        .sport-category {
          font-size: 12px;
          color: var(--muted);
        }

        .skip-hint {
          margin-top: 20px;
          text-align: center;
          color: var(--muted2);
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// STEP 5: PHOTOS (OPTIONAL)
// ============================================================================

function Step5Photos({
  profilePhoto,
  headerPhoto,
  onProfileChange,
  onHeaderChange,
}: {
  profilePhoto: string | null;
  headerPhoto: string | null;
  onProfileChange: (photo: string | null) => void;
  onHeaderChange: (photo: string | null) => void;
}) {
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (photo: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="step-container">
      <h1 className="step-title">Personalize Your Profile 📸</h1>
      <p className="step-description">
        Add photos to make your profile uniquely yours (optional).
      </p>

      <div className="photo-section">
        <div className="photo-input-group">
          <label>Profile Photo</label>
          <div className="photo-preview">
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="preview-image" />
            ) : (
              <div className="preview-placeholder">+</div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, onProfileChange)}
            className="file-input"
            id="profile-photo"
          />
          <label htmlFor="profile-photo" className="upload-button">
            {profilePhoto ? "Change Photo" : "Upload Photo"}
          </label>
        </div>

        <div className="photo-input-group">
          <label>Header Photo</label>
          <div className="photo-preview header">
            {headerPhoto ? (
              <img src={headerPhoto} alt="Header" className="preview-image" />
            ) : (
              <div className="preview-placeholder">+</div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, onHeaderChange)}
            className="file-input"
            id="header-photo"
          />
          <label htmlFor="header-photo" className="upload-button">
            {headerPhoto ? "Change Photo" : "Upload Photo"}
          </label>
        </div>
      </div>

      <p className="skip-hint">
        You can skip this and add photos later in settings.
      </p>

      <style jsx>{`
        .photo-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin-bottom: 20px;
        }

        .photo-input-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .photo-preview {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 2px dashed var(--panel-border);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          overflow: hidden;
        }

        .photo-preview.header {
          width: 100%;
          height: 100px;
          border-radius: 12px;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-placeholder {
          font-size: 32px;
          color: var(--muted2);
        }

        .file-input {
          display: none;
        }

        .upload-button {
          display: block;
          width: 100%;
          padding: 10px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--panel-border);
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
          transition: background 0.2s;
          font-size: 14px;
        }

        .upload-button:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .skip-hint {
          text-align: center;
          color: var(--muted2);
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// WIZARD FOOTER
// ============================================================================

function WizardFooter({
  step,
  canProceed,
  onPrev,
  onNext,
  onComplete,
}: {
  step: number;
  canProceed: boolean;
  onPrev: () => void;
  onNext: () => void;
  onComplete: () => void;
}) {
  const isLastStep = step === 5;

  return (
    <div className="wizard-footer">
      {step > 1 && (
        <button onClick={onPrev} className="wizard-button secondary">
          ← Previous
        </button>
      )}

      <div className="spacer" />

      {isLastStep ? (
        <button onClick={onComplete} className="wizard-button primary">
          Complete Setup →
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="wizard-button primary"
        >
          Next →
        </button>
      )}

      <style jsx>{`
        .wizard-footer {
          display: flex;
          gap: 12px;
          padding: 24px 32px;
          border-top: 1px solid var(--panel-border);
        }

        .spacer {
          flex: 1;
        }

        .wizard-button {
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .wizard-button.primary {
          background: var(--blue);
          border: none;
          color: white;
        }

        .wizard-button.primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
        }

        .wizard-button.primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .wizard-button.secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--panel-border);
        }

        .wizard-button.secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        @media (max-width: 640px) {
          .wizard-footer {
            padding: 16px 20px;
          }
        }
      `}</style>
    </div>
  );
}
