"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { PlatformId, ProfileState, TVConnectPlanId, TVConnectState, TVBrandId } from "../types";
import { normalizeKey, toggleInArray, uniq } from "../lib/utils";
import { ALL_PLATFORM_IDS, GENRES, PLATFORMS, TV_BRANDS, TV_CONNECT_PLANS, genreIconCandidates, platformById, platformIconCandidates, tvBrandLogoCandidates } from "../data";
import { loadAttribution, loadTVConnect, loadViewing, saveAttribution, saveProfile, saveTVConnect, saveViewing } from "../lib/storage";
import { track } from "../../../lib/catalog";
import { Chip, IconMic, PillButton, SmartImg } from "../ui/ui";

/* =========================
   ✅ Voice: real mic (Web Speech API)
   ========================= */

function useSpeechRecognition() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!Ctor);
  }, []);

  const start = () => {
    if (typeof window === "undefined") return;
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) {
      setError("SpeechRecognition not supported in this browser.");
      return;
    }

    setError(null);
    setInterim("");
    setFinalText("");

    const rec = new Ctor();
    recRef.current = rec;

    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = (e: any) => setError(e?.error ? String(e.error) : "speech_error");

    rec.onresult = (event: any) => {
      let interimText = "";
      let finalOut = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const txt = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) finalOut += txt;
        else interimText += txt;
      }
      setInterim(interimText.trim());
      if (finalOut.trim()) setFinalText(finalOut.trim());
    };

    try { rec.start(); } catch (e: any) { setError("Failed to start speech recognition."); }
  };

  const stop = () => {
    try { recRef.current?.stop?.(); } catch {}
  };

  return { supported, listening, interim, finalText, error, start, stop };
}

export function VoiceCenter({ onCommand }: { onCommand: (cmd: string) => void }) {
  const [cmd, setCmd] = useState("");
  const { supported, listening, interim, finalText, error, start, stop } = useSpeechRecognition();

  useEffect(() => {
    if (finalText) {
      setCmd(finalText);
      onCommand(finalText);
      track("voice_speech_final", { text: finalText });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalText]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
        Voice commands are now real (browser SpeechRecognition). Best support: Chrome / Edge on HTTPS.
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            className="ampere-focus"
            onClick={() => (listening ? stop() : start())}
            disabled={!supported}
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(58,167,255,0.22)",
              background: listening ? "rgba(255,72,72,0.18)" : "rgba(58,167,255,0.12)",
              color: "white",
              fontWeight: 950,
              cursor: supported ? "pointer" : "not-allowed",
              opacity: supported ? 1 : 0.6,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <IconMic /> {listening ? "Listening…" : "Press to Talk"}
          </button>

          <div style={{ opacity: 0.78, fontWeight: 900, fontSize: 13 }}>
            {supported ? (interim ? <>Heard: <span style={{ color: "white" }}>{interim}</span></> : "Say: “search ufc”, “go live”, “home”, “favs”.")
              : "SpeechRecognition unsupported. Use typing below."}
          </div>
        </div>

        {error ? <div style={{ opacity: 0.85, fontWeight: 900, color: "rgba(255,160,160,0.95)" }}>Voice error: {error}</div> : null}

        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontWeight: 950 }}>Command (fallback)</div>
          <input
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onCommand(cmd); }}
            placeholder='Try: "search ufc", "go live", "home", "favs"'
            className="ampere-focus"
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid var(--stroke2)",
              background: "rgba(0,0,0,0.35)",
              color: "white",
              outline: "none",
              fontWeight: 850,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            type="button"
            className="ampere-focus"
            onClick={() => onCommand(cmd)}
            style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(58,167,255,0.22)", background: "rgba(58,167,255,0.12)", color: "white", fontWeight: 950, cursor: "pointer" }}
          >
            Run
          </button>
          <button
            type="button"
            className="ampere-focus"
            onClick={() => setCmd("")}
            style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "white", fontWeight: 950, cursor: "pointer" }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   ✅ Remote redesigned (mock-friendly layout)
   ========================= */

export function RemotePad({ onAction }: { onAction: (a: string) => void }) {
  const Btn = ({ label, style, sub }: { label: string; style?: React.CSSProperties; sub?: string }) => (
    <button
      type="button"
      className="ampere-focus"
      onClick={() => onAction(label)}
      style={{
        padding: "12px 12px",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        color: "white",
        fontWeight: 950,
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        gap: 4,
        ...style,
      }}
      aria-label={sub ? `${label} ${sub}` : label}
    >
      <div>{label}</div>
      {sub ? <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 900 }}>{sub}</div> : null}
    </button>
  );

  const Pill = ({ label }: { label: string }) => (
    <button
      type="button"
      className="ampere-focus"
      onClick={() => onAction(label)}
      style={{
        padding: "10px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.22)",
        color: "white",
        fontWeight: 950,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "grid", gap: 14, justifyItems: "center" }}>
      <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5, textAlign: "center" }}>
        Redesigned remote layout (D-pad + transport + volume/channel). Map these to CEC / TV OS APIs later.
      </div>

      <div
        style={{
          width: "min(520px, 100%)",
          borderRadius: 34,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "linear-gradient(180deg, rgba(58,167,255,0.10), rgba(0,0,0,0.00) 50%), rgba(255,255,255,0.04)",
          boxShadow: "var(--shadow-md)",
          padding: 14,
          display: "grid",
          gap: 12,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Btn label="POWER" sub="⏻" style={{ background: "rgba(255,72,72,0.14)" }} />
          <Btn label="MIC" sub="Voice" style={{ background: "rgba(58,167,255,0.12)" }} />
          <Btn label="SETTINGS" sub="⚙" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div />
          <Btn label="UP" />
          <div />
          <Btn label="LEFT" />
          <Btn label="OK" style={{ background: "rgba(255,255,255,0.10)" }} />
          <Btn label="RIGHT" />
          <div />
          <Btn label="DOWN" />
          <div />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Btn label="BACK" sub="←" />
          <Btn label="HOME" sub="⌂" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Btn label="VOL +" sub="Volume" />
          <Btn label="CH +" sub="Channel" />
          <Btn label="VOL -" />
          <Btn label="CH -" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <Btn label="REW" sub="⏪" />
          <Btn label="PLAY" sub="⏯" />
          <Btn label="FWD" sub="⏩" />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <Pill label="LIVE" />
          <Pill label="FAVS" />
          <Pill label="SEARCH" />
        </div>
      </div>
    </div>
  );
}

/* =========================
   ✅ TV Connect modal (brands + plans)
   ========================= */

export function TVConnectModal({
  state,
  setState,
}: {
  state: TVConnectState;
  setState: (s: TVConnectState) => void;
}) {
  const setBrand = (id: TVBrandId) => {
    const next = { ...state, brandId: id, updatedAt: new Date().toISOString() };
    setState(next);
    saveTVConnect(next);
    track("tv_connect_brand", { id });
  };

  const setPlan = (id: TVConnectPlanId) => {
    const next = { ...state, planId: id, updatedAt: new Date().toISOString() };
    setState(next);
    saveTVConnect(next);
    track("tv_connect_plan", { id });
  };

  const togglePaired = () => {
    const next = { ...state, paired: !state.paired, updatedAt: new Date().toISOString() };
    setState(next);
    saveTVConnect(next);
    track("tv_connect_pair_toggle", { paired: next.paired });
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
        TV Connect (demo): choose a TV ecosystem + plan. In production this becomes native pairing + local discovery + CEC/vendor control.
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950 }}>Brands</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {TV_BRANDS.map((b) => {
            const active = state.brandId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                className="ampere-focus"
                onClick={() => setBrand(b.id)}
                style={{
                  borderRadius: 18,
                  border: active ? "1px solid rgba(58,167,255,0.38)" : "1px solid rgba(255,255,255,0.12)",
                  background: active ? "rgba(58,167,255,0.12)" : "rgba(255,255,255,0.04)",
                  padding: 12,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <SmartImg sources={tvBrandLogoCandidates(b.id)} size={34} rounded={12} fit="contain" fallbackText={b.label[0]} />
                <div style={{ fontWeight: 950, opacity: 0.94 }}>{b.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950 }}>Plans</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
          {TV_CONNECT_PLANS.map((p) => {
            const active = state.planId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className="ampere-focus"
                onClick={() => setPlan(p.id)}
                style={{
                  borderRadius: 18,
                  border: active ? "1px solid rgba(58,167,255,0.38)" : "1px solid rgba(255,255,255,0.12)",
                  background: active ? "rgba(58,167,255,0.12)" : "rgba(255,255,255,0.04)",
                  padding: 12,
                  display: "grid",
                  gap: 8,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                  <div style={{ fontWeight: 950 }}>{p.label}</div>
                  <div style={{ fontWeight: 950, opacity: 0.85 }}>{p.priceLabel}</div>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.86, fontWeight: 900, lineHeight: 1.5 }}>
                  {p.bullets.map((x) => <li key={x}>{x}</li>)}
                </ul>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="ampere-focus"
        onClick={togglePaired}
        style={{
          padding: "12px 14px",
          borderRadius: 14,
          border: "1px solid rgba(58,167,255,0.22)",
          background: state.paired ? "rgba(58,167,255,0.14)" : "rgba(0,0,0,0.22)",
          color: "white",
          fontWeight: 950,
          cursor: "pointer",
          width: "fit-content",
        }}
      >
        {state.paired ? "Paired (demo)" : "Pair TV (demo)"}
      </button>
    </div>
  );
}

/* =========================
   About (supports images)
   ========================= */

export function AboutContent() {
  const imageSlots = [
    { title: "Home rails", sources: ["/assets/about/home.png", "/assets/about/home.svg"] },
    { title: "Genre filters", sources: ["/assets/about/genre.png", "/assets/about/genre.svg"] },
    { title: "TV Connect", sources: ["/assets/about/tvconnect.png", "/assets/about/tvconnect.svg"] },
    { title: "Remote + Voice", sources: ["/assets/about/remote-voice.png", "/assets/about/remote-voice.svg"] },
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ fontWeight: 950, fontSize: 18 }}>Control, Reimagined.</div>
      <div style={{ opacity: 0.82, fontWeight: 900, lineHeight: 1.5 }}>
        AMPÈRE is a concept demo for a unified TV experience: browse across services, see what’s live, and launch content fast — from remote, voice, or personalized rails.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
        {imageSlots.map((s) => (
          <div key={s.title} style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 12, display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 950, opacity: 0.92 }}>{s.title}</div>
            <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.22)", height: 160 }}>
              <SmartImg sources={s.sources} size={900} rounded={0} border={false} fit="cover" fill fallbackText="Image" />
            </div>
            <div style={{ opacity: 0.72, fontWeight: 900, fontSize: 12 }}>
              Drop a file at <code>/public/assets/about/</code> to populate this.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
