"use client";
import React, { useState, useEffect } from "react";
import {
  type PlanTier, getPlanState, setPlanState, isPremium, canAccessFeature,
  getAllPlanDefinitions, getPlanDefinition, getTastePacks, getAllAddOnDefinitions,
} from "../lib/premiumPlan";
import {
  type TasteProfile, type DiscoveryContract, type WhyThisPickData,
  getTasteProfile, saveTasteProfile, addFeedback, exportTaste, importTaste,
} from "../lib/tasteEngine";
import {
  type QueueItem, getQueuedItems, getWatchedItems, addToQueue, removeFromQueue,
  markWatched, exportVault, importVault,
} from "../lib/universalQueue";
import {
  type DelightBucket, DELIGHT_BUCKETS, CONTEXT_PRESETS,
  getDelightState, setDelightState,
} from "../lib/timeToDelight";
import {
  type ModeId, MODE_DEFINITIONS, getModeState, setMode, getModeDefinition,
} from "../lib/modes";
import {
  type Scene, getAllScenes, executeScene, type SceneStep,
} from "../lib/scenes";
import {
  getConnectedPlatforms, fetchAndStoreEntitlement, ingestWatchState,
  getContinueWatchingFromWatchState, getStoredEntitlement,
} from "../lib/connectLadder";
import {
  type DeviceState, type EmulatorState,
  getDeviceState, startQRPairing, confirmQRPairing,
  connectLocalHub, disconnectLocalHub, sendLocalHubCommand,
  enableCloudRelay, executeCloudMacro,
  getEmulatorState, emulatorPlay, emulatorPause, emulatorResume,
  emulatorStop, emulatorSetVolume, emulatorSetMode, emulatorToggleCaptions,
  emulatorExecuteScene,
} from "../lib/deviceCore";
import { getDemoCircles, type MicroCircle, createDecisionRoom, voteInRoom, decideRoom, sendCoWatchPrompt } from "../lib/social";
import { getLivePulseState, markAlertRead, type LiveEvent, type LiveAlert } from "../lib/livePulse";
import { addLog } from "../lib/telemetry";
import { isPrivateMode, setPrivateMode, exportAllData, importAllData } from "../lib/storage";
import { getFamilyProfiles, saveFamilyProfiles, type FamilyProfile } from "../lib/storage";
import * as betsLib from "../lib/bets";

/* ============================================================
   SHARED STYLES
   ============================================================ */
const panelStyle: React.CSSProperties = { borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: 16 };
const btnPrimary: React.CSSProperties = { padding: "12px 18px", borderRadius: 14, border: "1px solid rgba(58,167,255,0.35)", background: "rgba(58,167,255,0.15)", color: "white", fontWeight: 950, cursor: "pointer", fontSize: 14 };
const btnGold: React.CSSProperties = { ...btnPrimary, border: "1px solid rgba(255,179,0,0.4)", background: "rgba(255,179,0,0.15)", color: "#ffcc44" };
const btnSecondary: React.CSSProperties = { padding: "10px 16px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", color: "white", fontWeight: 900, cursor: "pointer", fontSize: 13 };
const chipStyle: React.CSSProperties = { display: "inline-flex", padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 900, background: "rgba(58,167,255,0.12)", border: "1px solid rgba(58,167,255,0.25)", color: "rgba(58,167,255,1)" };
const goldChip: React.CSSProperties = { ...chipStyle, background: "rgba(255,179,0,0.12)", border: "1px solid rgba(255,179,0,0.3)", color: "#ffcc44" };
const lockIcon = "\uD83D\uDD12";
const heroTitle: React.CSSProperties = { fontSize: 22, fontWeight: 950, marginBottom: 4 };
const heroSub: React.CSSProperties = { opacity: 0.7, fontSize: 13, fontWeight: 900, marginBottom: 16 };
const sectionTitle: React.CSSProperties = { fontSize: 15, fontWeight: 950, marginBottom: 8, marginTop: 16 };

/* ============================================================
   1. PREMIUM HUB
   ============================================================ */
export function PremiumHubContent({ onOpenPricing }: { onOpenPricing: () => void }) {
  const plan = getPlanState();
  const def = getPlanDefinition("premium");
  const packs = getTastePacks();
  useEffect(() => { addLog("screen_open_premiumHub"); }, []);
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={heroTitle}>AMPÈRE Premium</div>
      <div style={heroSub}>Unlock the full power of your streaming universe.</div>
      {plan.plan === "premium" ? (
        <div style={{ ...panelStyle, borderColor: "rgba(255,179,0,0.35)" }}>
          <div style={{ fontWeight: 950, color: "#ffcc44", marginBottom: 4 }}>Active Premium Member</div>
          <div style={{ opacity: 0.7, fontSize: 13 }}>Since {new Date(plan.since).toLocaleDateString()}</div>
        </div>
      ) : (
        <button type="button" style={btnGold} onClick={onOpenPricing}>Upgrade to Premium — $9.99/mo</button>
      )}
      <div style={sectionTitle}>Premium Features</div>
      <div style={{ display: "grid", gap: 8 }}>
        {def.features.map((f, i) => <div key={i} style={{ ...panelStyle, padding: 12, fontSize: 13 }}><span style={{ color: "#ffcc44", marginRight: 8 }}>★</span>{f}</div>)}
      </div>
      <div style={sectionTitle}>Monthly Taste Packs</div>
      {packs.map((p) => (
        <div key={p.id} style={{ ...panelStyle, padding: 12 }}>
          <div style={{ fontWeight: 950, fontSize: 14 }}>{p.name}</div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>{p.description}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>{p.genres.map((g) => <span key={g} style={goldChip}>{g}</span>)}</div>
        </div>
      ))}
      <div style={sectionTitle}>How it works</div>
      <div style={{ opacity: 0.7, fontSize: 13 }}>Select Premium from the pricing screen. Your plan is stored locally on your device. All Premium features unlock instantly. Taste Packs refresh monthly.</div>
    </div>
  );
}

/* ============================================================
   2. PRICING
   ============================================================ */
export function PricingContent({ onSelect }: { onSelect: (tier: PlanTier) => void }) {
  const [current, setCurrent] = useState(getPlanState().plan);
  useEffect(() => { addLog("screen_open_pricing"); }, []);
  const plans = getAllPlanDefinitions();
  const addons = getAllAddOnDefinitions();
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={heroTitle}>Choose Your Plan</div>
      <div style={heroSub}>Device connection is free for everyone. Upgrade for advanced personalization.</div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {plans.map((p) => {
          const active = current === p.id;
          const isPremiumCard = p.id === "premium";
          return (
            <div key={p.id} style={{ ...panelStyle, borderColor: active ? (isPremiumCard ? "rgba(255,179,0,0.5)" : "rgba(58,167,255,0.5)") : "rgba(255,255,255,0.12)", background: active ? (isPremiumCard ? "rgba(255,179,0,0.08)" : "rgba(58,167,255,0.08)") : p.color, position: "relative" }}>
              {p.badge && <div style={{ position: "absolute", top: -8, right: 12, ...goldChip, fontSize: 10 }}>{p.badge}</div>}
              <div style={{ fontWeight: 950, fontSize: 18, marginBottom: 2 }}>{p.name}</div>
              <div style={{ fontWeight: 900, fontSize: 22, color: isPremiumCard ? "#ffcc44" : "rgba(58,167,255,1)", marginBottom: 8 }}>{p.price}</div>
              {p.features.map((f, i) => <div key={i} style={{ fontSize: 12, opacity: 0.8, marginBottom: 3 }}>• {f}</div>)}
              <button type="button" style={{ ...(isPremiumCard ? btnGold : btnPrimary), width: "100%", marginTop: 12 }} onClick={() => { onSelect(p.id); setCurrent(p.id); }}>
                {active ? "Current Plan" : `Select ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>
      {/* À la carte & Add-ons */}
      <div style={sectionTitle}>À La Carte & Add-Ons</div>
      <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 4 }}>Mix and match — add these to any plan above.</div>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {addons.map((a) => {
          const isGameDay = a.id === "gameday";
          return (
            <div key={a.id} style={{ ...panelStyle, borderColor: isGameDay ? "rgba(0,200,80,0.35)" : "rgba(255,255,255,0.12)", background: a.color, position: "relative" }}>
              {a.badge && <div style={{ position: "absolute", top: -8, right: 12, ...chipStyle, background: "rgba(0,200,80,0.15)", borderColor: "rgba(0,200,80,0.3)", color: "#44dd88", fontSize: 10 }}>{a.badge}</div>}
              <div style={{ fontWeight: 950, fontSize: 16, marginBottom: 2 }}>{a.name}</div>
              <div style={{ fontWeight: 900, fontSize: 18, color: isGameDay ? "#44dd88" : "rgba(58,167,255,1)", marginBottom: 8 }}>{a.price}</div>
              {a.features.map((f, i) => <div key={i} style={{ fontSize: 12, opacity: 0.8, marginBottom: 3 }}>• {f}</div>)}
              <button type="button" style={{ ...(isGameDay ? { ...btnPrimary, borderColor: "rgba(0,200,80,0.35)", background: "rgba(0,200,80,0.15)", color: "#44dd88" } : btnSecondary), width: "100%", marginTop: 12 }} onClick={() => { onSelect(a.id as PlanTier); }}>
                Add {a.name}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   3. TASTE ENGINE
   ============================================================ */
export function TasteEngineContent({ locked, onUpgrade, hideHero }: { locked: boolean; onUpgrade: () => void; hideHero?: boolean }) {
  const [taste, setTaste] = useState(getTasteProfile);
  const [contract, setContract] = useState<DiscoveryContract>(taste.discoveryContract);
  useEffect(() => { addLog("screen_open_tasteEngine"); }, []);
  if (locked) return <LockedScreen name="Taste Engine" desc="Fine-tune what you see. Comfort vs discovery, mute topics, discovery contracts." onUpgrade={onUpgrade} />;
  const update = (patch: Partial<TasteProfile>) => { const next = { ...taste, ...patch }; setTaste(next); saveTasteProfile(next); };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {!hideHero && <><div style={heroTitle}>Taste Engine</div>
      <div style={heroSub}>Shape your recommendations. Changes apply immediately to For You.</div></>}
      <div style={sectionTitle}>Preference Sliders</div>
      {[
        { label: "Comfort", key: "comfort" as const, desc: "Familiar favorites" },
        { label: "Discovery", key: "discovery" as const, desc: "Something new" },
        { label: "Live Weight", key: "liveWeight" as const, desc: "Prefer live content" },
        { label: "Short Content", key: "shortWeight" as const, desc: "Quick watches" },
      ].map(({ label, key, desc }) => (
        <div key={key} style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontWeight: 950, fontSize: 13 }}>{label}</span><span style={{ opacity: 0.6, fontSize: 12 }}>{taste[key]}</span></div>
          <div style={{ opacity: 0.6, fontSize: 11, marginBottom: 6 }}>{desc}</div>
          <input type="range" min={0} max={100} value={taste[key]} onChange={(e) => update({ [key]: +e.target.value })} style={{ width: "100%", accentColor: "rgba(58,167,255,1)" }} />
        </div>
      ))}
      <div style={sectionTitle}>Discovery Contract</div>
      <div style={{ ...panelStyle, borderColor: "rgba(58,167,255,0.2)", background: "rgba(58,167,255,0.04)", marginBottom: 8 }}>
        <div style={{ fontWeight: 950, fontSize: 13, marginBottom: 4 }}>What is a Discovery Contract?</div>
        <div style={{ opacity: 0.7, fontSize: 12, lineHeight: 1.6 }}>A Discovery Contract sets boundaries on how aggressively AMPERE recommends content outside your comfort zone. "Safe" means only familiar genres and titles. Wildcard slots allow AMPERE to inject surprise picks — the more wildcards you allow, the more diverse your feed becomes. This directly affects how the ranking algorithm scores new content in your For You rail.</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["safe", "one_wildcard", "three_wildcards"] as const).map((c) => (
          <button key={c} type="button" style={{ ...(contract === c ? btnPrimary : btnSecondary) }} onClick={() => { setContract(c); update({ discoveryContract: c }); }}>
            {c === "safe" ? "Safe — No wildcards" : c === "one_wildcard" ? "1 Wildcard" : "3 Wildcards"}
          </button>
        ))}
      </div>
      <div style={sectionTitle}>Muted Genres</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {["Horror / Cult", "Sports", "Kids", "Gaming", "LGBT", "Anime & AsianTV"].map((g) => {
          const muted = taste.mutedGenres.includes(g);
          return (
            <button key={g} type="button" style={{ ...chipStyle, background: muted ? "rgba(255,72,72,0.15)" : "rgba(255,255,255,0.06)", borderColor: muted ? "rgba(255,72,72,0.3)" : "rgba(255,255,255,0.14)", color: muted ? "#ff8888" : "rgba(255,255,255,0.7)" }}
              onClick={() => update({ mutedGenres: muted ? taste.mutedGenres.filter((x) => x !== g) : [...taste.mutedGenres, g] })}>
              {muted ? "✕ " : ""}{g}
            </button>
          );
        })}
      </div>
      <div style={sectionTitle}>Export / Import Taste</div>
      <div style={{ ...panelStyle, borderColor: "rgba(58,167,255,0.2)", background: "rgba(58,167,255,0.04)", marginBottom: 8 }}>
        <div style={{ fontWeight: 950, fontSize: 13, marginBottom: 4 }}>How Export & Import works</div>
        <div style={{ opacity: 0.7, fontSize: 12, lineHeight: 1.6 }}><b>Export:</b> Downloads your complete taste profile (sliders, muted genres, discovery contract, feedback history) as a JSON file to your device. Use this to back up your preferences or transfer them to another browser/device.<br/><b>Import:</b> Upload a previously exported taste file to restore or apply another profile's preferences. This overwrites your current taste settings with the imported data. Useful when setting up a new device or sharing taste settings between family members.</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" style={btnSecondary} onClick={() => { const d = exportTaste(); const blob = new Blob([d], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `ampere-taste-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url); }}>Download Taste</button>
        <button type="button" style={btnSecondary} onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = ".json"; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) f.text().then((t) => { importTaste(t); setTaste(getTasteProfile()); }); }; input.click(); }}>Import Taste File</button>
      </div>
    </div>
  );
}

/* ============================================================
   3b. TASTE ENGINE HUB — Unified layout integrating Taste, Modes,
       Scenes, Connect Ladder, Live Pulse, and Why This Pick
   ============================================================ */
type TasteHubTab = "taste" | "modes" | "scenes" | "connect" | "livepulse" | "delight" | "whypick" | "queue" | "trust" | "family";
const TASTE_HUB_TABS: { id: TasteHubTab; label: string; icon: string }[] = [
  { id: "taste", label: "Preferences", icon: "🎯" },
  { id: "delight", label: "Time-to-Delight", icon: "⏱" },
  { id: "modes", label: "Modes", icon: "🎭" },
  { id: "scenes", label: "Scenes", icon: "⚡" },
  { id: "connect", label: "Connect", icon: "🔗" },
  { id: "livepulse", label: "Live Pulse", icon: "📡" },
  { id: "whypick", label: "Why This Pick?", icon: "💡" },
  { id: "queue", label: "Queue", icon: "📋" },
  { id: "trust", label: "Trust & Privacy", icon: "🛡️" },
  { id: "family", label: "Family", icon: "👨‍👩‍👧‍👦" },
];
export function TasteEngineHub({ locked, onUpgrade, initialTab = "taste" }: { locked: boolean; onUpgrade: () => void; initialTab?: TasteHubTab }) {
  const [tab, setTab] = useState<TasteHubTab>(initialTab);
  useEffect(() => { setTab(initialTab); }, [initialTab]);
  if (locked) return <LockedScreen name="Taste Engine" desc="Fine-tune recommendations, set context modes, automate scenes, and connect platforms — all in one place." onUpgrade={onUpgrade} />;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={heroTitle}>Taste Engine</div>
      <div style={heroSub}>Your personalization command center. Shape what you see, how you see it, and what happens when you press play.</div>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 10 }}>
        {TASTE_HUB_TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{ padding: "8px 14px", borderRadius: 999, border: tab === t.id ? "1px solid rgba(58,167,255,0.5)" : "1px solid rgba(255,255,255,0.10)", background: tab === t.id ? "rgba(58,167,255,0.14)" : "rgba(255,255,255,0.04)", color: "white", fontWeight: 950, cursor: "pointer", fontSize: 12 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {/* Tab content — hideHero prevents redundant titles */}
      {tab === "taste" && <TasteEngineContent locked={false} onUpgrade={onUpgrade} hideHero />}
      {tab === "delight" && <TimeToDelightContent locked={false} onUpgrade={onUpgrade} onSet={() => {}} hideHero />}
      {tab === "modes" && <ModesContent locked={false} onUpgrade={onUpgrade} onSet={() => {}} hideHero />}
      {tab === "scenes" && <RemoteScenesContent locked={false} onUpgrade={onUpgrade} onExecute={(scene) => { executeScene(scene, async () => {}); }} hideHero />}
      {tab === "connect" && <ConnectLadderContent locked={false} onUpgrade={onUpgrade} hideHero />}
      {tab === "livepulse" && <LivePulseContent locked={false} onUpgrade={onUpgrade} hideHero />}
      {tab === "whypick" && <WhyThisPickContent data={null} locked={false} onUpgrade={onUpgrade} onAction={() => {}} hideHero />}
      {tab === "queue" && <UniversalQueueContent locked={false} onUpgrade={onUpgrade} hideHero />}
      {tab === "trust" && <TrustPortabilityContent locked={false} onUpgrade={onUpgrade} hideHero />}
      {tab === "family" && <FamilyProfilesContent locked={false} onUpgrade={onUpgrade} hideHero />}
    </div>
  );
}

/* ============================================================
   4. WHY THIS PICK
   ============================================================ */
export function WhyThisPickContent({ data, locked, onUpgrade, onAction, hideHero }: { data: WhyThisPickData | null; locked: boolean; onUpgrade: () => void; onAction: (action: string, contentId: string) => void; hideHero?: boolean }) {
  useEffect(() => { addLog("screen_open_whyThisPick"); }, []);
  if (locked) return <LockedScreen name="Why This Pick?" desc="See exactly why content was recommended, with score breakdowns and tune actions." onUpgrade={onUpgrade} />;
  if (!data) return <div style={panelStyle}><div style={{ opacity: 0.6 }}>Select a card first, then tap "Why This Pick?" to see the breakdown.</div></div>;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {!hideHero && <><div style={heroTitle}>Why This Pick?</div>
      <div style={heroSub}>{data.contentTitle}</div></>}
      <div style={{ ...panelStyle, textAlign: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 950, color: "rgba(58,167,255,1)" }}>{data.totalScore.toFixed(1)}</div>
        <div style={{ opacity: 0.6, fontSize: 12 }}>Relevance Score</div>
      </div>
      <div style={sectionTitle}>Because...</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {data.chips.map((c, i) => (
          <span key={i} style={{ ...chipStyle, background: c.score > 0 ? "rgba(58,167,255,0.12)" : "rgba(255,72,72,0.12)", borderColor: c.score > 0 ? "rgba(58,167,255,0.25)" : "rgba(255,72,72,0.25)", color: c.score > 0 ? "rgba(58,167,255,1)" : "#ff8888" }}>
            {c.label} ({c.score > 0 ? "+" : ""}{c.score.toFixed(1)})
          </span>
        ))}
      </div>
      <div style={sectionTitle}>Tune This</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" style={btnPrimary} onClick={() => onAction("more", data.contentId)}>More like this</button>
        <button type="button" style={btnSecondary} onClick={() => onAction("less", data.contentId)}>Less like this</button>
        <button type="button" style={btnSecondary} onClick={() => onAction("mute", data.contentId)}>Mute topic</button>
        <button type="button" style={btnPrimary} onClick={() => onAction("queue", data.contentId)}>Add to Queue</button>
      </div>
    </div>
  );
}

/* ============================================================
   5. UNIVERSAL QUEUE
   ============================================================ */
export function UniversalQueueContent({ locked, onUpgrade, hideHero }: { locked: boolean; onUpgrade: () => void; hideHero?: boolean }) {
  const [queued, setQueued] = useState(getQueuedItems);
  const [watched, setWatched] = useState(getWatchedItems);
  const [vaultTag, setVaultTag] = useState("");
  useEffect(() => { addLog("screen_open_universalQueue"); }, []);
  if (locked) return <LockedScreen name="Universal Queue" desc="Watch Later with availability resolution across all your platforms." onUpgrade={onUpgrade} />;
  const refresh = () => { setQueued(getQueuedItems()); setWatched(getWatchedItems()); };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {!hideHero && <><div style={heroTitle}>Universal Queue</div>
      <div style={heroSub}>Your watch list with cross-platform availability tracking.</div></>}
      <div style={{ ...panelStyle, borderColor: "rgba(58,167,255,0.2)", background: "rgba(58,167,255,0.04)" }}>
        <div style={{ fontWeight: 950, fontSize: 13, marginBottom: 4 }}>How it works</div>
        <div style={{ opacity: 0.7, fontSize: 12, lineHeight: 1.6 }}>Add any content to your Universal Queue from a card or via voice command. AMPERE checks which of your connected platforms carry that title, picks the best one, and lists alternates. Mark items "Done" when watched. Export your queue and watch history as a portable vault file to back up or transfer between devices.</div>
      </div>
      <div style={sectionTitle}>Queued ({queued.length})</div>
      {queued.length === 0 && <div style={{ ...panelStyle, opacity: 0.6 }}>No items in queue. Add content from cards or via voice.</div>}
      {queued.map((item) => (
        <div key={item.id} style={{ ...panelStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 14 }}>{item.title}</div>
            <div style={{ opacity: 0.6, fontSize: 12 }}>{item.preferredPlatform} {item.reason ? `• ${item.reason}` : ""}</div>
            {item.alternatePlatforms.length > 0 && <div style={{ fontSize: 11, opacity: 0.5 }}>Also on: {item.alternatePlatforms.join(", ")}</div>}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" style={{ ...btnSecondary, padding: "6px 10px", fontSize: 11 }} onClick={() => { markWatched(item.id); refresh(); }}>Done</button>
            <button type="button" style={{ ...btnSecondary, padding: "6px 10px", fontSize: 11, color: "#ff8888" }} onClick={() => { removeFromQueue(item.id); refresh(); }}>✕</button>
          </div>
        </div>
      ))}
      <div style={sectionTitle}>Watched ({watched.length})</div>
      {watched.slice(0, 5).map((item) => (
        <div key={item.id} style={{ ...panelStyle, padding: 10, opacity: 0.6 }}>
          <span style={{ fontWeight: 900, fontSize: 13 }}>{item.title}</span> <span style={{ fontSize: 11 }}>• {item.preferredPlatform}</span>
        </div>
      ))}
      <div style={sectionTitle}>Export / Import Vault</div>
      <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 6 }}>Download your queue + watch history as a portable file, or import a vault backup.</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input value={vaultTag} onChange={(e) => setVaultTag(e.target.value)} placeholder="Version tag" style={{ padding: "8px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(0,0,0,0.35)", color: "white", flex: 1, fontSize: 13, fontWeight: 900, outline: "none" }} />
        <button type="button" style={btnSecondary} onClick={() => { const d = exportVault(vaultTag || "v1"); const blob = new Blob([d], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `ampere-vault-${vaultTag || "v1"}-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url); }}>Download</button>
        <button type="button" style={btnSecondary} onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = ".json"; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) f.text().then((t) => { importVault(t); refresh(); }); }; input.click(); }}>Import File</button>
      </div>
    </div>
  );
}

/* ============================================================
   6. TIME-TO-DELIGHT
   ============================================================ */
export function TimeToDelightContent({ locked, onUpgrade, onSet, hideHero }: { locked: boolean; onUpgrade: () => void; onSet: (bucket: DelightBucket | null, ctx?: string) => void; hideHero?: boolean }) {
  const [state, setState] = useState(getDelightState);
  useEffect(() => { addLog("screen_open_timeToDelight"); }, []);
  if (locked) return <LockedScreen name="Time-to-Delight" desc="Tell us how much time you have and we'll find the perfect content." onUpgrade={onUpgrade} />;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {!hideHero && <><div style={heroTitle}>Time-to-Delight</div>
      <div style={heroSub}>How much time do you have? We'll rank content accordingly.</div></>}
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
        {DELIGHT_BUCKETS.map((b) => {
          const active = state.activeBucket === b.bucket;
          return (
            <button key={b.bucket} type="button" style={{ ...panelStyle, cursor: "pointer", textAlign: "center", borderColor: active ? "rgba(58,167,255,0.5)" : "rgba(255,255,255,0.12)", background: active ? "rgba(58,167,255,0.12)" : "rgba(255,255,255,0.04)" }}
              onClick={() => { const next = setDelightState(active ? null : b.bucket); setState(next); onSet(active ? null : b.bucket); }}>
              {/* Blank placeholder rounded square — drop custom images into public/assets/delight/{bucket}.png */}
              <div style={{ width: 48, height: 48, borderRadius: 10, background: active ? "rgba(58,167,255,0.18)" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", margin: "0 auto 6px" }} />
              <div style={{ fontWeight: 950, fontSize: 16 }}>{b.label}</div>
              <div style={{ opacity: 0.6, fontSize: 11 }}>{b.description}</div>
            </button>
          );
        })}
      </div>
      {state.activeBucket && <button type="button" style={btnSecondary} onClick={() => { const next = setDelightState(null); setState(next); onSet(null); }}>Clear time filter</button>}
      <div style={sectionTitle}>Context Presets</div>
      <div style={{ display: "grid", gap: 8 }}>
        {CONTEXT_PRESETS.map((p) => (
          <button key={p.id} type="button" style={{ ...panelStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, borderColor: state.context === p.id ? "rgba(58,167,255,0.4)" : "rgba(255,255,255,0.12)" }}
            onClick={() => { const next = setDelightState(p.bucket, p.id); setState(next); onSet(p.bucket, p.id); }}>
            <div style={{ fontSize: 20, minWidth: 28 }}>{p.bucket}m</div>
            <div><div style={{ fontWeight: 950, fontSize: 13 }}>{p.label}</div><div style={{ opacity: 0.6, fontSize: 11 }}>{p.description}</div></div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   7. MODES
   ============================================================ */
export function ModesContent({ locked, onUpgrade, onSet, hideHero }: { locked: boolean; onUpgrade: () => void; onSet: (mode: ModeId) => void; hideHero?: boolean }) {
  const [current, setCurrent] = useState(getModeState().activeMode);
  useEffect(() => { addLog("screen_open_modes"); }, []);
  if (locked) return <LockedScreen name="Context Modes" desc="Reshape your rails and prioritization with one tap." onUpgrade={onUpgrade} />;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {!hideHero && <><div style={heroTitle}>Context Modes</div>
      <div style={heroSub}>One tap reshapes everything — rails, ranking, volume, captions.</div></>}
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {MODE_DEFINITIONS.map((m) => {
          const active = current === m.id;
          return (
            <button key={m.id} type="button" style={{ ...panelStyle, cursor: "pointer", textAlign: "center", borderColor: active ? "rgba(58,167,255,0.5)" : "rgba(255,255,255,0.12)", background: active ? "rgba(58,167,255,0.12)" : "rgba(255,255,255,0.04)" }}
              onClick={() => { setMode(m.id); setCurrent(m.id); onSet(m.id); }}>
              <div style={{ fontSize: 28 }}>{m.icon}</div>
              <div style={{ fontWeight: 950, fontSize: 14 }}>{m.name}</div>
              <div style={{ opacity: 0.6, fontSize: 11, marginTop: 4 }}>{m.description}</div>
              {active && <div style={{ ...chipStyle, marginTop: 8 }}>ACTIVE</div>}
            </button>
          );
        })}
      </div>
      <div style={sectionTitle}>How it works</div>
      <div style={{ opacity: 0.7, fontSize: 13 }}>Modes boost certain genres and suppress others. They can also set volume presets, toggle captions, and trigger linked remote scenes.</div>
    </div>
  );
}

/* ============================================================
   8. REMOTE SCENES
   ============================================================ */
export function RemoteScenesContent({ locked, onUpgrade, onExecute, hideHero }: { locked: boolean; onUpgrade: () => void; onExecute: (scene: Scene) => void; hideHero?: boolean }) {
  const [scenes] = useState(getAllScenes);
  const [lastExec, setLastExec] = useState<string | null>(null);
  useEffect(() => { addLog("screen_open_remoteScenes"); }, []);
  if (locked) return <LockedScreen name="Remote Scenes" desc="One-tap macros that set mode, volume, captions, and navigation." onUpgrade={onUpgrade} />;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {!hideHero && <><div style={heroTitle}>Remote Scenes</div>
      <div style={heroSub}>Execute multi-step sequences with one tap.</div></>}
      {scenes.map((s) => (
        <div key={s.id} style={{ ...panelStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 14 }}>{s.icon} {s.name} {s.isPremiumPack ? <span style={goldChip}>Pack</span> : null}</div>
            <div style={{ opacity: 0.6, fontSize: 12 }}>{s.description}</div>
            <div style={{ opacity: 0.4, fontSize: 11, marginTop: 4 }}>{s.steps.length} steps: {s.steps.map((st) => st.type).join(" → ")}</div>
          </div>
          <button type="button" style={lastExec === s.id ? { ...btnPrimary, background: "rgba(0,200,0,0.15)", borderColor: "rgba(0,200,0,0.3)" } : btnPrimary}
            onClick={() => { onExecute(s); setLastExec(s.id); setTimeout(() => setLastExec(null), 2000); }}>
            {lastExec === s.id ? "✓ Done" : "Execute"}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   9. CONNECT LADDER
   ============================================================ */
export function ConnectLadderContent({ locked, onUpgrade, hideHero }: { locked: boolean; onUpgrade: () => void; hideHero?: boolean }) {
  const [connected] = useState(getConnectedPlatforms);
  const [fetching, setFetching] = useState<string | null>(null);
  const [ingesting, setIngesting] = useState<string | null>(null);
  const [cwItems, setCwItems] = useState(getContinueWatchingFromWatchState);
  useEffect(() => { addLog("screen_open_connectLadder"); }, []);
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {!hideHero && <><div style={heroTitle}>Connect Platforms Ladder</div>
      <div style={heroSub}>Three levels of integration — from deep links to full watch-state sync.</div></>}
      {/* Level 1 */}
      <div style={{ ...panelStyle, borderColor: "rgba(58,167,255,0.3)" }}>
        <div style={{ fontWeight: 950, fontSize: 14, color: "rgba(58,167,255,1)" }}>Level 1 — Deep Link (Free)</div>
        <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>Open content directly on any connected platform.</div>
        <div style={{ opacity: 0.5, fontSize: 11, marginTop: 4 }}>{connected.length} platforms connected</div>
      </div>
      {/* Level 2 */}
      <div style={{ ...panelStyle, borderColor: locked ? "rgba(255,255,255,0.08)" : "rgba(255,179,0,0.3)" }}>
        <div style={{ fontWeight: 950, fontSize: 14, color: locked ? "rgba(255,255,255,0.5)" : "#ffcc44" }}>Level 2 — Entitlements {locked && lockIcon} <span style={goldChip}>Premium</span></div>
        <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>Know what you can watch on each platform. Gates playback based on your subscription tier.</div>
        {!locked && connected.slice(0, 5).map((pid) => {
          const ent = getStoredEntitlement(pid);
          return (
            <div key={pid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontWeight: 900, fontSize: 13 }}>{pid} {ent ? <span style={chipStyle}>{ent.tier}</span> : null}</span>
              <button type="button" style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11 }} onClick={async () => { setFetching(pid); await fetchAndStoreEntitlement(pid); setFetching(null); }}>{fetching === pid ? "..." : "Fetch"}</button>
            </div>
          );
        })}
        {locked && <button type="button" style={{ ...btnGold, marginTop: 8 }} onClick={onUpgrade}>Unlock with Premium</button>}
      </div>
      {/* Level 3 */}
      <div style={{ ...panelStyle, borderColor: locked ? "rgba(255,255,255,0.08)" : "rgba(255,179,0,0.3)" }}>
        <div style={{ fontWeight: 950, fontSize: 14, color: locked ? "rgba(255,255,255,0.5)" : "#ffcc44" }}>Level 3 — Watch State Sync {locked && lockIcon} <span style={goldChip}>Premium</span></div>
        <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>Continue Watching from any platform, all in one place.</div>
        {!locked && (
          <>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {connected.slice(0, 3).map((pid) => (
                <button key={pid} type="button" style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11 }} onClick={async () => { setIngesting(pid); await ingestWatchState(pid); setCwItems(getContinueWatchingFromWatchState()); setIngesting(null); }}>{ingesting === pid ? "..." : `Ingest ${pid}`}</button>
              ))}
            </div>
            {cwItems.length > 0 && <div style={sectionTitle}>Continue Watching</div>}
            {cwItems.slice(0, 5).map((w) => (
              <div key={w.id} style={{ ...panelStyle, padding: 10, marginTop: 4 }}>
                <div style={{ fontWeight: 900, fontSize: 13 }}>{w.title} <span style={{ opacity: 0.5 }}>({w.platformId})</span></div>
                <div style={{ opacity: 0.5, fontSize: 11 }}>{w.percentComplete}% • {w.episodeInfo ? `S${w.episodeInfo.season}E${w.episodeInfo.episode}` : ""}</div>
              </div>
            ))}
          </>
        )}
        {locked && <button type="button" style={{ ...btnGold, marginTop: 8 }} onClick={onUpgrade}>Unlock with Premium</button>}
      </div>
    </div>
  );
}

/* ============================================================
   10. TRUST / PORTABILITY
   ============================================================ */
export function TrustPortabilityContent({ locked, onUpgrade, hideHero }: { locked: boolean; onUpgrade: () => void; hideHero?: boolean }) {
  const [priv, setPriv] = useState(isPrivateMode);
  useEffect(() => { addLog("screen_open_trustPortability"); }, []);
  if (locked) return <LockedScreen name="Trust & Portability" desc="Your profile lives on your device. Export everything. Private mode. Full control." onUpgrade={onUpgrade} />;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {!hideHero && <><div style={heroTitle}>Trust, Privacy & Portability</div>
      <div style={heroSub}>Your profile lives on your device. You own your data.</div></>}
      <div style={panelStyle}>
        <div style={{ fontWeight: 950, fontSize: 14 }}>🛡️ Device-Local Storage</div>
        <div style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>All preferences, viewing history, taste data, and queue are stored in your browser's localStorage. Nothing leaves your device unless you export it.</div>
      </div>
      <div style={{ ...panelStyle, borderColor: priv ? "rgba(0,200,0,0.3)" : "rgba(255,255,255,0.12)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 14 }}>{priv ? "🟢" : "⚫"} Private Mode</div>
            <div style={{ opacity: 0.7, fontSize: 12 }}>{priv ? "Active — telemetry and viewing history paused" : "Off — normal tracking"}</div>
          </div>
          <button type="button" style={priv ? { ...btnPrimary, background: "rgba(0,200,0,0.15)", borderColor: "rgba(0,200,0,0.3)" } : btnSecondary}
            onClick={() => { const next = !priv; setPrivateMode(next); setPriv(next); addLog("private_mode_toggle", { enabled: next }); }}>
            {priv ? "Disable" : "Enable"}
          </button>
        </div>
      </div>
      <div style={sectionTitle}>Export / Import Everything</div>
      <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 8 }}>Export your taste, viewing history, profiles, and queue as a single portable JSON file.</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" style={btnPrimary} onClick={() => { const d = exportAllData(); const blob = new Blob([d], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `ampere-export-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url); }}>Download Export</button>
        <button type="button" style={btnSecondary} onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = ".json"; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) f.text().then((t) => { importAllData(t); alert("Import complete!"); }); }; input.click(); }}>Import File</button>
      </div>
    </div>
  );
}

/* ============================================================
   11. FAMILY PROFILES
   ============================================================ */
export function FamilyProfilesContent({ locked, onUpgrade, hideHero }: { locked: boolean; onUpgrade: () => void; hideHero?: boolean }) {
  const [profiles, setProfiles] = useState(getFamilyProfiles);
  const [newName, setNewName] = useState("");
  const [isKid, setIsKid] = useState(false);
  useEffect(() => { addLog("screen_open_familyProfiles"); }, []);
  if (locked) return <LockedScreen name="Family Profiles" desc="Up to 5 profiles with separated tastes, history, and queue. Kid-safe options included." onUpgrade={onUpgrade} />;
  const create = () => {
    if (!newName.trim() || profiles.length >= 5) return;
    const p: FamilyProfile = { id: `fp_${Date.now()}`, name: newName.trim(), avatar: null, isKid, createdAt: Date.now() };
    const next = [...profiles, p];
    saveFamilyProfiles(next);
    setProfiles(next);
    setNewName("");
    addLog("family_profile_create", { name: p.name, isKid });
  };
  const remove = (id: string) => {
    const next = profiles.filter((p) => p.id !== id);
    saveFamilyProfiles(next);
    setProfiles(next);
  };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {!hideHero && <><div style={heroTitle}>Family Profiles</div>
      <div style={heroSub}>Up to 5 profiles. Each gets their own taste, history, and queue.</div></>}
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
        {profiles.map((p) => (
          <div key={p.id} style={{ ...panelStyle, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>{p.isKid ? "🧒" : "👤"}</div>
            <div style={{ fontWeight: 950, fontSize: 14 }}>{p.name}</div>
            <div style={{ opacity: 0.5, fontSize: 11 }}>{p.isKid ? "Kid profile" : "Standard"}</div>
            <button type="button" style={{ ...btnSecondary, marginTop: 8, padding: "4px 10px", fontSize: 11, color: "#ff8888" }} onClick={() => remove(p.id)}>Remove</button>
          </div>
        ))}
        {profiles.length < 5 && (
          <div style={{ ...panelStyle, textAlign: "center", borderStyle: "dashed" }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>+</div>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(0,0,0,0.3)", color: "white", width: "100%", fontSize: 12, fontWeight: 900, outline: "none", marginBottom: 6 }} />
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, opacity: 0.7, cursor: "pointer" }}><input type="checkbox" checked={isKid} onChange={(e) => setIsKid(e.target.checked)} /> Kid profile</label>
            <button type="button" style={{ ...btnPrimary, marginTop: 8, padding: "6px 12px", fontSize: 12 }} onClick={create}>Create</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   12. SOCIAL
   ============================================================ */
export function SocialContent({ locked, onUpgrade }: { locked: boolean; onUpgrade: () => void }) {
  const [circles] = useState(getDemoCircles);
  useEffect(() => { addLog("screen_open_social"); }, []);
  if (locked) return <LockedScreen name="Social" desc="Micro-circles, decision rooms, and co-watch prompts with friends." onUpgrade={onUpgrade} />;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={heroTitle}>Social</div>
      <div style={heroSub}>Watch together, decide together.</div>
      <span style={goldChip}>Phase 4 — Coming Soon</span>
      <div style={sectionTitle}>Your Circles</div>
      {circles.map((c) => (
        <div key={c.id} style={panelStyle}>
          <div style={{ fontWeight: 950, fontSize: 14 }}>{c.name}</div>
          <div style={{ opacity: 0.6, fontSize: 12 }}>{c.members.length} members • {c.tasteOverlap.overlapScore}% taste overlap</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {c.tasteOverlap.sharedGenres.map((g) => <span key={g} style={chipStyle}>{g}</span>)}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button type="button" style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11 }} onClick={() => { sendCoWatchPrompt(c.id, "Movie Night Pick", "netflix", "Based on shared taste"); }}>Send Co-watch</button>
            <button type="button" style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11 }}>Decision Room</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   13. LIVE PULSE
   ============================================================ */
export function LivePulseContent({ locked, onUpgrade, hideHero }: { locked: boolean; onUpgrade: () => void; hideHero?: boolean }) {
  const [state, setState] = useState(getLivePulseState);
  useEffect(() => { addLog("screen_open_livePulse"); }, []);
  if (locked) return <LockedScreen name="Live Pulse" desc="Real-time event feed, score alerts, and game-start notifications." onUpgrade={onUpgrade} />;
  const statusColors: Record<string, string> = { live: "#ff4444", upcoming: "rgba(58,167,255,1)", halftime: "#ffaa00", final: "rgba(255,255,255,0.4)" };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {!hideHero && <><div style={heroTitle}>Live Pulse</div>
      <div style={heroSub}>Real-time events and alerts for your teams.</div></>}
      <span style={goldChip}>Phase 4 — Coming Soon</span>
      <div style={sectionTitle}>Live Events</div>
      {state.events.map((ev) => (
        <div key={ev.id} style={{ ...panelStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 14 }}>{ev.title}</div>
            <div style={{ opacity: 0.6, fontSize: 12 }}>{ev.subtitle} • {ev.league}</div>
            {ev.score && <div style={{ fontWeight: 950, fontSize: 16, marginTop: 2 }}>{ev.score}</div>}
          </div>
          <span style={{ ...chipStyle, background: `${statusColors[ev.status] ?? "gray"}22`, borderColor: `${statusColors[ev.status] ?? "gray"}44`, color: statusColors[ev.status] ?? "gray", textTransform: "uppercase" }}>{ev.status}</span>
        </div>
      ))}
      {state.alerts.length > 0 && <div style={sectionTitle}>Recent Alerts ({state.alerts.filter((a) => !a.read).length} unread)</div>}
      {state.alerts.slice(0, 5).map((a) => (
        <div key={a.id} style={{ ...panelStyle, padding: 10, opacity: a.read ? 0.5 : 1, cursor: "pointer" }} onClick={() => { markAlertRead(a.id); setState(getLivePulseState()); }}>
          <div style={{ fontWeight: 900, fontSize: 12 }}>{a.title}</div>
          <div style={{ opacity: 0.6, fontSize: 11 }}>{a.body}</div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   14. SEMANTIC SEARCH
   ============================================================ */
export function SemanticSearchContent({ locked, onUpgrade }: { locked: boolean; onUpgrade: () => void }) {
  useEffect(() => { addLog("screen_open_semanticSearch"); }, []);
  if (locked) return <LockedScreen name="Semantic Search & Clustering" desc="AI-powered search with TF-IDF ranking and taste clustering — works offline." onUpgrade={onUpgrade} />;
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={heroTitle}>Semantic Search & Clustering</div>
      <div style={heroSub}>On-device search with TF-IDF ranking — no network needed.</div>
      <span style={goldChip}>Phase 4 — Coming Soon</span>
      <div style={panelStyle}>
        <div style={{ opacity: 0.7, fontSize: 13 }}>This feature uses a deterministic TF-IDF engine built into the app. It indexes all your content metadata locally and provides instant search results with relevance scoring.</div>
      </div>
      <div style={sectionTitle}>How it works</div>
      <div style={{ opacity: 0.7, fontSize: 13 }}>1. Content is tokenized and indexed on load<br/>2. Queries are matched using TF-IDF scoring<br/>3. Results are clustered by genre + tag similarity<br/>4. Works fully offline — no API calls needed</div>
    </div>
  );
}

/* ============================================================
   15. ADD DEVICE (FREEMIUM)
   ============================================================ */
export function AddDeviceContent() {
  const [dev, setDev] = useState(getDeviceState);
  const [tab, setTab] = useState<"qr" | "hub" | "cloud" | "other">("qr");
  const [simConfirm, setSimConfirm] = useState(false);
  useEffect(() => { addLog("screen_open_addDevice"); }, []);
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={heroTitle}>Add Device</div>
      <div style={heroSub}>Connect your TV using any of these methods. Free for all plans.</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["qr", "hub", "cloud", "other"] as const).map((t) => (
          <button key={t} type="button" style={tab === t ? btnPrimary : btnSecondary} onClick={() => setTab(t)}>
            {t === "qr" ? "QR Pairing" : t === "hub" ? "Local Hub" : t === "cloud" ? "Cloud Relay" : "Other Methods"}
          </button>
        ))}
      </div>
      {/* QR Tab */}
      {tab === "qr" && (
        <div style={panelStyle}>
          <div style={{ fontWeight: 950, fontSize: 14, marginBottom: 8 }}>Companion App Pairing</div>
          {dev.pairing.status === "waiting" && dev.pairing.pairingCode ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>Scan this code with the AMPÈRE companion app:</div>
              <div style={{ fontSize: 36, fontWeight: 950, letterSpacing: 8, background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 24px", display: "inline-block", fontFamily: "monospace" }}>{dev.pairing.pairingCode}</div>
              <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>Waiting for confirmation...</div>
              {!simConfirm && <button type="button" style={{ ...btnPrimary, marginTop: 12 }} onClick={() => { setSimConfirm(true); const next = confirmQRPairing("Living Room TV"); setDev(next); }}>Simulate Confirm</button>}
            </div>
          ) : dev.pairing.status === "connected" && dev.pairing.method === "qr" ? (
            <div style={{ textAlign: "center", color: "rgba(0,200,0,0.9)" }}>
              <div style={{ fontSize: 24 }}>✓</div>
              <div style={{ fontWeight: 950 }}>Connected to {dev.pairing.deviceName}</div>
            </div>
          ) : (
            <button type="button" style={btnPrimary} onClick={() => { const next = startQRPairing(); setDev(next); setSimConfirm(false); }}>Generate Pairing Code</button>
          )}
        </div>
      )}
      {/* Hub Tab */}
      {tab === "hub" && (
        <div style={panelStyle}>
          <div style={{ fontWeight: 950, fontSize: 14, marginBottom: 8 }}>Local Hub Simulator</div>
          {dev.localHub?.status === "connected" ? (
            <div>
              <div style={{ color: "rgba(0,200,0,0.9)", fontWeight: 950, marginBottom: 8 }}>✓ Connected: {dev.localHub.hubName} ({dev.localHub.ipAddress})</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["play", "pause", "volume_up", "volume_down", "home"].map((cmd) => (
                  <button key={cmd} type="button" style={{ ...btnSecondary, padding: "6px 10px", fontSize: 11 }} onClick={() => { const next = sendLocalHubCommand(cmd); setDev(next); }}>{cmd}</button>
                ))}
              </div>
              {dev.localHub.lastCommand && <div style={{ opacity: 0.5, fontSize: 11, marginTop: 6 }}>Last: {dev.localHub.lastCommand}</div>}
              <button type="button" style={{ ...btnSecondary, marginTop: 8, color: "#ff8888" }} onClick={() => { const next = disconnectLocalHub(); setDev(next); }}>Disconnect</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["appletv", "androidtv", "raspberrypi"] as const).map((type) => (
                <button key={type} type="button" style={btnPrimary} onClick={() => { const next = connectLocalHub(type); setDev(next); }}>
                  {type === "appletv" ? "Apple TV" : type === "androidtv" ? "Android TV" : "Raspberry Pi"}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Cloud Tab */}
      {tab === "cloud" && (
        <div style={panelStyle}>
          <div style={{ fontWeight: 950, fontSize: 14, marginBottom: 8 }}>Cloud Relay Mode</div>
          <div style={{ opacity: 0.6, fontSize: 12, marginBottom: 8 }}>Limited remote macros via cloud — open queue, change mode, execute scenes.</div>
          {dev.cloudRelay.enabled ? (
            <div>
              <div style={{ color: "rgba(58,167,255,1)", fontWeight: 950, marginBottom: 8 }}>☁️ Cloud Relay Active</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {dev.cloudRelay.macrosAvailable.map((m) => (
                  <button key={m} type="button" style={{ ...btnSecondary, padding: "6px 10px", fontSize: 11 }} onClick={() => { const next = executeCloudMacro(m); setDev(next); }}>{m}</button>
                ))}
              </div>
              {dev.cloudRelay.lastMacro && <div style={{ opacity: 0.5, fontSize: 11, marginTop: 6 }}>Last: {dev.cloudRelay.lastMacro}</div>}
            </div>
          ) : (
            <button type="button" style={btnPrimary} onClick={() => { const next = enableCloudRelay(); setDev(next); }}>Enable Cloud Relay</button>
          )}
        </div>
      )}
      {/* Other Connection Methods */}
      {tab === "other" && (
        <div style={{ display: "grid", gap: 10 }}>
          {[
            { name: "HDMI-CEC", icon: "🔌", desc: "Control your TV through HDMI-CEC commands. Works with most modern TVs. No additional hardware needed — uses your existing HDMI connection.", status: "Available" },
            { name: "AirPlay", icon: "📱", desc: "Stream and control via Apple AirPlay 2. Works with AirPlay-compatible smart TVs and Apple TV devices.", status: "Available" },
            { name: "Miracast", icon: "📡", desc: "Wireless display mirroring using Wi-Fi Direct. Native support on Windows, Android, and many smart TVs.", status: "Available" },
            { name: "DLNA / UPnP", icon: "🌐", desc: "Discover and stream to any DLNA-compatible device on your local network. Works with most smart TVs, game consoles, and media players.", status: "Available" },
            { name: "Google Cast", icon: "📺", desc: "Cast content to Chromecast devices and Cast-enabled smart TVs using Google's Cast protocol.", status: "Available" },
            { name: "Bluetooth", icon: "🔵", desc: "Connect to Bluetooth-enabled displays and audio devices for local streaming and control.", status: "Beta" },
          ].map((m) => (
            <div key={m.name} style={{ ...panelStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 950, fontSize: 14 }}>{m.icon} {m.name} {m.status === "Beta" ? <span style={{ ...chipStyle, fontSize: 9, background: "rgba(255,179,0,0.12)", borderColor: "rgba(255,179,0,0.3)", color: "#ffcc44" }}>BETA</span> : null}</div>
                <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4, maxWidth: 400 }}>{m.desc}</div>
              </div>
              <button type="button" style={btnSecondary} onClick={() => addLog("device_connect_method", { method: m.name })}>Connect</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   16. VIRTUAL TV EMULATOR (FREEMIUM)
   ============================================================ */
export function VirtualEmulatorContent() {
  const [emu, setEmu] = useState(getEmulatorState);
  const [demoTitle, setDemoTitle] = useState("Stranger Things");
  const [ccLang, setCcLang] = useState("en");
  const [translatorOn, setTranslatorOn] = useState(false);
  useEffect(() => { addLog("screen_open_virtualEmulator"); }, []);
  const refresh = () => setEmu(getEmulatorState());
  const CC_LANGUAGES = [
    { code: "en", label: "English" }, { code: "es", label: "Spanish" }, { code: "fr", label: "French" },
    { code: "de", label: "German" }, { code: "pt", label: "Portuguese" }, { code: "ja", label: "Japanese" },
    { code: "ko", label: "Korean" }, { code: "zh", label: "Chinese" }, { code: "ar", label: "Arabic" },
    { code: "hi", label: "Hindi" }, { code: "it", label: "Italian" }, { code: "ru", label: "Russian" },
  ];
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={heroTitle}>Virtual TV Emulator</div>
      <div style={heroSub}>See how your TV responds to commands. Free for everyone.</div>
      {/* TV Screen */}
      <div style={{ borderRadius: 18, border: "2px solid rgba(255,255,255,0.2)", background: emu.playbackState === "idle" ? "rgba(0,0,0,0.8)" : "linear-gradient(135deg, #0a1628, #0d2040)", padding: 24, textAlign: "center", minHeight: 140 }}>
        {emu.playbackState === "idle" ? (
          <div style={{ opacity: 0.4, fontSize: 16, fontWeight: 950 }}>No Signal</div>
        ) : (
          <div>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4 }}>{emu.playbackState === "playing" ? "▶ PLAYING" : emu.playbackState === "paused" ? "⏸ PAUSED" : "⏳ BUFFERING"}</div>
            <div style={{ fontSize: 20, fontWeight: 950 }}>{emu.currentTitle}</div>
            <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>{emu.currentPlatform}</div>
            {emu.currentMode && <div style={{ ...chipStyle, marginTop: 8 }}>Mode: {emu.currentMode}</div>}
          </div>
        )}
        <div style={{ marginTop: 8, opacity: 0.5, fontSize: 11 }}>Vol: {emu.volume} | CC: {emu.captionsEnabled ? `ON (${ccLang.toUpperCase()})` : "OFF"}{translatorOn ? " | Translator: ON" : ""}</div>
      </div>
      {/* Controls */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <button type="button" style={btnPrimary} onClick={() => { emulatorPlay(demoTitle, "netflix"); refresh(); }}>▶ Play</button>
        <button type="button" style={btnSecondary} onClick={() => { emulatorPause(); refresh(); }}>⏸ Pause</button>
        <button type="button" style={btnSecondary} onClick={() => { emulatorResume(); refresh(); }}>▶ Resume</button>
        <button type="button" style={btnSecondary} onClick={() => { emulatorStop(); refresh(); }}>⏹ Stop</button>
        <button type="button" style={emu.captionsEnabled ? { ...btnPrimary, background: "rgba(58,167,255,0.25)", borderColor: "rgba(58,167,255,0.6)", boxShadow: "0 0 8px rgba(58,167,255,0.3)" } : btnSecondary} onClick={() => { emulatorToggleCaptions(); refresh(); }}>
          {emu.captionsEnabled ? "CC ✓" : "CC"}
        </button>
      </div>
      {/* CC Language & Translator */}
      <div style={{ ...panelStyle, display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 950, fontSize: 13 }}>Closed Captions & Language</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CC_LANGUAGES.map((l) => (
            <button key={l.code} type="button" style={{ ...chipStyle, cursor: "pointer", background: ccLang === l.code ? "rgba(58,167,255,0.18)" : "rgba(255,255,255,0.06)", borderColor: ccLang === l.code ? "rgba(58,167,255,0.5)" : "rgba(255,255,255,0.12)", color: ccLang === l.code ? "rgba(58,167,255,1)" : "rgba(255,255,255,0.6)" }}
              onClick={() => setCcLang(l.code)}>{l.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 13 }}>Language Translator</div>
            <div style={{ opacity: 0.6, fontSize: 11 }}>Auto-translate captions when CC not available in your language</div>
          </div>
          <button type="button" style={translatorOn ? { ...btnPrimary, background: "rgba(0,200,0,0.15)", borderColor: "rgba(0,200,0,0.3)", padding: "8px 14px" } : { ...btnSecondary, padding: "8px 14px" }}
            onClick={() => { setTranslatorOn(!translatorOn); addLog("translator_toggle", { enabled: !translatorOn, lang: ccLang }); }}>
            {translatorOn ? "ON" : "OFF"}
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12, opacity: 0.6, minWidth: 28 }}>Vol</span>
        <input type="range" min={0} max={100} value={emu.volume} onChange={(e) => { emulatorSetVolume(+e.target.value); refresh(); }} style={{ flex: 1, accentColor: "rgba(58,167,255,1)" }} />
        <span style={{ fontSize: 12, opacity: 0.6, minWidth: 28 }}>{emu.volume}</span>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input value={demoTitle} onChange={(e) => setDemoTitle(e.target.value)} placeholder="Content title" style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(0,0,0,0.3)", color: "white", flex: 1, fontSize: 12, fontWeight: 900, outline: "none" }} />
      </div>
      {/* Mode Quick Set */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {["game_day", "kids", "date_night", "background"].map((m) => (
          <button key={m} type="button" style={{ ...chipStyle, cursor: "pointer" }} onClick={() => { emulatorSetMode(m); refresh(); }}>{m}</button>
        ))}
      </div>
      {/* Event Log */}
      <div style={sectionTitle}>Event Log</div>
      <div style={{ maxHeight: 150, overflowY: "auto" }}>
        {emu.events.slice(0, 15).map((ev, i) => (
          <div key={i} style={{ fontSize: 11, opacity: 0.6, marginBottom: 3, fontFamily: "monospace" }}>
            [{new Date(ev.at).toLocaleTimeString()}] {ev.type}: {ev.detail}
          </div>
        ))}
        {emu.events.length === 0 && <div style={{ opacity: 0.4, fontSize: 12 }}>No events yet. Try the controls above.</div>}
      </div>
    </div>
  );
}

/* ============================================================
   17. BETTING COMPANION (Game Day Add-On)
   ============================================================ */
export function BettingCompanionContent({ locked, onUpgrade }: { locked: boolean; onUpgrade: () => void }) {
  const [bets, setBets] = useState(betsLib.getAllBets);
  const [stats, setStats] = useState(() => betsLib.computeStats());
  const [tab, setTab] = useState<"slip" | "open" | "settled" | "stats">("slip");
  const [title, setTitle] = useState(""); const [pick, setPick] = useState("");
  const [odds, setOdds] = useState(-110); const [stake, setStake] = useState(0);
  const [tags, setTags] = useState<betsLib.BetTag[]>(["Straight"]);
  const [notes, setNotes] = useState(""); const [pasteText, setPasteText] = useState("");
  useEffect(() => { addLog("screen_open_bettingCompanion"); }, []);
  if (locked) return <LockedScreen name="Betting Companion" desc="Track bets, compute P&L, quick-stake buttons, and export for taxes. Game Day add-on required." onUpgrade={onUpgrade} />;
  const refresh = () => { setBets(betsLib.getAllBets()); setStats(betsLib.computeStats()); };
  const placeBet = () => {
    if (!pick || stake <= 0) return;
    betsLib.addBet({ title, pick, odds, stake, tags, notes });
    setTitle(""); setPick(""); setOdds(-110); setStake(0); setNotes(""); setTags(["Straight"]);
    refresh();
  };
  const plColor = (v: number) => v > 0 ? "#44dd88" : v < 0 ? "#ff5555" : "rgba(255,255,255,0.6)";
  const statusColors: Record<string, string> = { open: "rgba(58,167,255,1)", won: "#44dd88", lost: "#ff5555", push: "#ffaa44", void: "rgba(255,255,255,0.4)" };
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={heroTitle}>Betting Companion</div>
      <div style={heroSub}>Track bets, compute odds, settle, and export. Game Day add-on.</div>
      {/* Stats Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8 }}>
        <div style={{ ...panelStyle, textAlign: "center", padding: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 950, color: plColor(stats.todayPL) }}>{stats.todayPL >= 0 ? "+" : ""}{stats.todayPL.toFixed(2)}</div>
          <div style={{ opacity: 0.5, fontSize: 10 }}>Today P&L</div>
        </div>
        <div style={{ ...panelStyle, textAlign: "center", padding: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 950, color: plColor(stats.weekPL) }}>{stats.weekPL >= 0 ? "+" : ""}{stats.weekPL.toFixed(2)}</div>
          <div style={{ opacity: 0.5, fontSize: 10 }}>Week P&L</div>
        </div>
        <div style={{ ...panelStyle, textAlign: "center", padding: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 950 }}>{stats.winRate.toFixed(0)}%</div>
          <div style={{ opacity: 0.5, fontSize: 10 }}>Win Rate</div>
        </div>
        <div style={{ ...panelStyle, textAlign: "center", padding: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 950, color: plColor(stats.roi) }}>{stats.roi.toFixed(1)}%</div>
          <div style={{ opacity: 0.5, fontSize: 10 }}>ROI</div>
        </div>
      </div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["slip", "open", "settled", "stats"] as const).map((t) => (
          <button key={t} type="button" style={tab === t ? btnPrimary : btnSecondary} onClick={() => setTab(t)}>
            {t === "slip" ? "Add Bet" : t === "open" ? `Open (${stats.openBets})` : t === "settled" ? "Settled" : "Stats"}
          </button>
        ))}
      </div>
      {/* Add Bet Slip */}
      {tab === "slip" && (
        <div style={{ display: "grid", gap: 10 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event / Matchup (e.g. Lakers vs Celtics)" style={inputStyle} />
          <input value={pick} onChange={(e) => setPick(e.target.value)} placeholder="Pick line (e.g. Lakers -3.5)" style={inputStyle} />
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4 }}>American Odds</div>
              <input type="number" value={odds} onChange={(e) => setOdds(+e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 4 }}>Payout</div>
              <div style={{ ...panelStyle, padding: "10px 12px", fontSize: 16, fontWeight: 950, color: "#44dd88" }}>${stake > 0 ? betsLib.computePayout(stake, odds).toFixed(2) : "0.00"}</div>
            </div>
          </div>
          {/* Quick Stakes */}
          <div style={{ fontSize: 11, opacity: 0.5 }}>Quick Stake</div>
          <div style={{ display: "flex", gap: 6 }}>
            {betsLib.QUICK_STAKES.map((q) => (
              <button key={q} type="button" style={{ ...(stake === q ? btnPrimary : btnSecondary), flex: 1, textAlign: "center" }} onClick={() => setStake(q)}>${q}</button>
            ))}
          </div>
          {/* Tags */}
          <div style={{ fontSize: 11, opacity: 0.5 }}>Tags</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["Straight", "Parlay", "Props", "Live", "Futures", "Teaser"] as betsLib.BetTag[]).map((t) => {
              const active = tags.includes(t);
              return <button key={t} type="button" style={{ ...chipStyle, background: active ? "rgba(0,200,80,0.15)" : "rgba(255,255,255,0.06)", borderColor: active ? "rgba(0,200,80,0.3)" : "rgba(255,255,255,0.14)", color: active ? "#44dd88" : "rgba(255,255,255,0.6)" }} onClick={() => setTags(active ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</button>;
            })}
          </div>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" style={inputStyle} />
          <button type="button" style={{ ...btnPrimary, borderColor: "rgba(0,200,80,0.35)", background: "rgba(0,200,80,0.15)", color: "#44dd88" }} onClick={placeBet}>Place Bet — ${stake > 0 ? stake.toFixed(2) : "0.00"} at {betsLib.formatOdds(odds)}</button>
          {/* Paste-to-add */}
          <div style={sectionTitle}>Paste-to-Add</div>
          <div style={{ opacity: 0.6, fontSize: 11, marginBottom: 4 }}>Paste lines like: "Lakers -3.5 -110 $25 #Props"</div>
          <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="Paste bet lines here..." rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace" }} />
          <button type="button" style={btnSecondary} onClick={() => {
            const parsed = betsLib.parseBetSlipText(pasteText);
            for (const p of parsed) betsLib.addBet({ ...p, title: p.title || "Pasted Bet" });
            if (parsed.length > 0) { setPasteText(""); refresh(); }
          }}>Parse & Add ({betsLib.parseBetSlipText(pasteText).length} bets detected)</button>
        </div>
      )}
      {/* Open Bets */}
      {tab === "open" && (
        <div style={{ display: "grid", gap: 8 }}>
          {bets.filter((b) => b.status === "open").length === 0 && <div style={{ ...panelStyle, opacity: 0.6 }}>No open bets. Add one from the bet slip tab.</div>}
          {bets.filter((b) => b.status === "open").map((b) => (
            <div key={b.id} style={{ ...panelStyle, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 950, fontSize: 14 }}>{b.title || b.pick}</div>
                  {b.title && <div style={{ opacity: 0.7, fontSize: 12 }}>{b.pick}</div>}
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <span style={{ ...chipStyle, fontSize: 10 }}>{betsLib.formatOdds(b.odds)}</span>
                    <span style={{ ...chipStyle, fontSize: 10 }}>${b.stake}</span>
                    <span style={{ ...chipStyle, fontSize: 10, color: "#44dd88", borderColor: "rgba(0,200,80,0.3)", background: "rgba(0,200,80,0.1)" }}>→ ${b.payout.toFixed(2)}</span>
                    {b.tags.map((t) => <span key={t} style={{ ...chipStyle, fontSize: 10 }}>{t}</span>)}
                  </div>
                  {b.notes && <div style={{ opacity: 0.5, fontSize: 11, marginTop: 4 }}>{b.notes}</div>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button type="button" style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11, color: "#44dd88" }} onClick={() => { betsLib.settleBet(b.id, "won"); refresh(); }}>Win</button>
                <button type="button" style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11, color: "#ff5555" }} onClick={() => { betsLib.settleBet(b.id, "lost"); refresh(); }}>Loss</button>
                <button type="button" style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11, color: "#ffaa44" }} onClick={() => { betsLib.settleBet(b.id, "push"); refresh(); }}>Push</button>
                <button type="button" style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11 }} onClick={() => { betsLib.cloneBet(b.id); refresh(); }}>Clone</button>
                <button type="button" style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11, color: "#ff8888" }} onClick={() => { betsLib.removeBet(b.id); refresh(); }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Settled Bets */}
      {tab === "settled" && (
        <div style={{ display: "grid", gap: 8 }}>
          {bets.filter((b) => b.status !== "open").length === 0 && <div style={{ ...panelStyle, opacity: 0.6 }}>No settled bets yet.</div>}
          {bets.filter((b) => b.status !== "open").map((b) => (
            <div key={b.id} style={{ ...panelStyle, padding: 10, opacity: 0.8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 13 }}>{b.title || b.pick}</div>
                  {b.title && <div style={{ opacity: 0.6, fontSize: 11 }}>{b.pick}</div>}
                </div>
                <span style={{ ...chipStyle, fontSize: 10, background: `${statusColors[b.status]}22`, borderColor: `${statusColors[b.status]}44`, color: statusColors[b.status], textTransform: "uppercase" }}>{b.status}</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 11, opacity: 0.6 }}>${b.stake} at {betsLib.formatOdds(b.odds)}</span>
                {b.status === "won" && <span style={{ fontSize: 11, color: "#44dd88" }}>+${(b.payout - b.stake).toFixed(2)}</span>}
                {b.status === "lost" && <span style={{ fontSize: 11, color: "#ff5555" }}>-${b.stake.toFixed(2)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Full Stats */}
      {tab === "stats" && (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ ...panelStyle, padding: 14 }}>
            <div style={{ fontWeight: 950, fontSize: 14, marginBottom: 8 }}>Bankroll & Session Stats</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><div style={{ opacity: 0.5, fontSize: 11 }}>Total Bets</div><div style={{ fontWeight: 950 }}>{stats.totalBets}</div></div>
              <div><div style={{ opacity: 0.5, fontSize: 11 }}>Open Bets</div><div style={{ fontWeight: 950 }}>{stats.openBets}</div></div>
              <div><div style={{ opacity: 0.5, fontSize: 11 }}>Won / Lost / Push</div><div style={{ fontWeight: 950 }}>{stats.wonBets} / {stats.lostBets} / {stats.pushBets}</div></div>
              <div><div style={{ opacity: 0.5, fontSize: 11 }}>Win Rate</div><div style={{ fontWeight: 950 }}>{stats.winRate.toFixed(1)}%</div></div>
              <div><div style={{ opacity: 0.5, fontSize: 11 }}>Total Staked</div><div style={{ fontWeight: 950 }}>${stats.totalStaked.toFixed(2)}</div></div>
              <div><div style={{ opacity: 0.5, fontSize: 11 }}>Total Payout</div><div style={{ fontWeight: 950 }}>${stats.totalPayout.toFixed(2)}</div></div>
              <div><div style={{ opacity: 0.5, fontSize: 11 }}>Net P&L</div><div style={{ fontWeight: 950, color: plColor(stats.netPL) }}>{stats.netPL >= 0 ? "+" : ""}${stats.netPL.toFixed(2)}</div></div>
              <div><div style={{ opacity: 0.5, fontSize: 11 }}>ROI</div><div style={{ fontWeight: 950, color: plColor(stats.roi) }}>{stats.roi.toFixed(1)}%</div></div>
            </div>
          </div>
          {/* Export */}
          <div style={sectionTitle}>Export for Taxes</div>
          <div style={{ opacity: 0.6, fontSize: 12, marginBottom: 4 }}>Download your full bet history as JSON or CSV.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={btnSecondary} onClick={() => { const d = betsLib.exportBetsJSON(); const blob = new Blob([d], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `ampere-bets-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url); }}>Export JSON</button>
            <button type="button" style={btnSecondary} onClick={() => { const d = betsLib.exportBetsCSV(); const blob = new Blob([d], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `ampere-bets-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url); }}>Export CSV</button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(0,0,0,0.35)", color: "white", fontSize: 13, fontWeight: 900, outline: "none", width: "100%" };

/* ============================================================
   LOCKED SCREEN HELPER
   ============================================================ */
function LockedScreen({ name, desc, onUpgrade }: { name: string; desc: string; onUpgrade: () => void }) {
  return (
    <div style={{ display: "grid", gap: 14, textAlign: "center", padding: "24px 0" }}>
      <div style={{ fontSize: 40 }}>{lockIcon}</div>
      <div style={heroTitle}>{name}</div>
      <div style={{ ...heroSub, maxWidth: 400, margin: "0 auto" }}>{desc}</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button type="button" style={btnGold} onClick={onUpgrade}>Upgrade to Premium — $9.99/mo</button>
      </div>
      <div style={{ opacity: 0.5, fontSize: 12 }}>Requires AMPÈRE Premium plan</div>
    </div>
  );
}
