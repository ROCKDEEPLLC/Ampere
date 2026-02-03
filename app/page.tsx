"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Item = { id: string; label: string };

const GENRES: Item[] = [
  { id: "all", label: "All" },
  { id: "livetv", label: "Live TV" },          // added back
  { id: "basic", label: "Basic Streaming" },
  { id: "premium", label: "Premium Streaming" },
  { id: "premium-sports", label: "Premium Sports Streaming" },
  { id: "movies", label: "Movie Streaming" },
  { id: "free", label: "Free Streaming" },
  { id: "docs", label: "Documentaries" },
  { id: "indie", label: "Indie and Arthouse Films" },
  { id: "horror", label: "Horror / Cult" },
  { id: "anime", label: "Anime / Asian cinema" },
  { id: "black", label: "Black culture & diaspora" },
  { id: "lgbt", label: "LGBT" },
  { id: "kids", label: "Kids" },              // added
  { id: "gaming", label: "Gaming" },          // added
];

const PLATFORMS: Item[] = [
  { id: "all", label: "ALL" },
  { id: "livetv", label: "Live TV" },
  { id: "netflix", label: "Netflix" },
  { id: "hulu", label: "Hulu" },
  { id: "prime", label: "Prime Video" },
  { id: "disney", label: "Disney+" },
  { id: "max", label: "Max" },
  { id: "peacock", label: "Peacock" },
  { id: "paramount", label: "Paramount+" },
  { id: "appletv", label: "Apple TV" },
  { id: "youtube", label: "YouTube" },
  { id: "youtubetv", label: "YouTube TV" },
  { id: "betplus", label: "BET+" },
  { id: "tubi", label: "Tubi" },
  { id: "sling", label: "Sling" },
  { id: "twitch", label: "Twitch" },
  { id: "fubotv", label: "FuboTV" },
  { id: "espn", label: "ESPN" },
  { id: "blackmedia", label: "Black Media" },
  { id: "hbcugo", label: "HBCUGO" },
  { id: "hbcugo-sports", label: "HBCUGO Sports" },

  // Your new “store/category” concept
  { id: "local-stations", label: "Local Stations" },
  { id: "foxsports", label: "Fox Sports" },
  { id: "fs1", label: "FS1" },
];

type Tab = "home" | "live" | "favs" | "search";

export default function Page() {
  const [genre, setGenre] = useState<string>("all");
  const [platform, setPlatform] = useState<string>("all");
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [tab, setTab] = useState<Tab>("home");

  const genreLabel = useMemo(
    () => GENRES.find((g) => g.id === genre)?.label ?? "All",
    [genre]
  );

  const platformLabel = useMemo(
    () => PLATFORMS.find((p) => p.id === platform)?.label ?? "ALL",
    [platform]
  );

  const genresToShow = useMemo(() => {
    if (showAllGenres) return GENRES;
    return GENRES.slice(0, 12);
  }, [showAllGenres]);

  const platformsToShow = useMemo(() => {
    if (showAllPlatforms) return PLATFORMS;
    return PLATFORMS.slice(0, 12);
  }, [showAllPlatforms]);

  return (
    <>
      <div className="shell">
        <header className="topBar">
          <div className="topBarGrid">
            {/* Left: short mark */}
            <div className="brandLeft">
              <div className="brandMark" aria-label="Ampere mark">
                {/* Put your short logo here: public/brand/ampere-mark.png */}
                <img src="/brand/ampere-mark.png" alt="Ampere" />
              </div>
            </div>

            {/* Center: long wordmark (replaces “Control Reimagined”) */}
            <div className="brandCenter">
              <div className="brandWordmark" aria-label="Ampere wordmark">
                {/* Put your long logo here: public/brand/ampere-wordmark.png */}
                <img
                  src="/brand/ampere-wordmark.png"
                  alt="Ampere"
                  onError={(e) => {
                    // fallback to text if image missing
                    const t = e.currentTarget;
                    t.style.display = "none";
                    const parent = t.parentElement;
                    if (parent && !parent.querySelector(".brandFallback")) {
                      const span = document.createElement("span");
                      span.className = "brandFallback";
                      span.textContent = "AMPERE";
                      parent.appendChild(span);
                    }
                  }}
                />
              </div>
            </div>

            {/* Right: action pills */}
            <div className="actions">
              <button className="pillBtn" type="button">
                <span className="pillDot" />
                Voice
              </button>
              <button className="pillBtn" type="button">
                <span className="pillDot" />
                Remote
              </button>
              <button className="pillBtn" type="button">
                <span className="pillDot" />
                Settings
              </button>
              <button className="pillBtn" type="button">
                <span className="pillDot" />
                Profile
              </button>
            </div>
          </div>
        </header>

        <main className="mainCard">
          <div className="sectionHead">
            <h1 className="h1">Filters</h1>
            <div className="metaLine">
              Genre: <strong>{genreLabel}</strong> • Platform:{" "}
              <strong>{platformLabel}</strong>
            </div>
          </div>

          {/* Genre */}
          <section className="subSection">
            <div className="subTitleRow">
              <h2 className="subTitle">Genre</h2>
              <button
                className="linkBtn"
                type="button"
                onClick={() => setShowAllGenres((v) => !v)}
              >
                {showAllGenres ? "Show less" : "See all"}
              </button>
            </div>

            <div className="pillGrid">
              {genresToShow.map((g) => (
                <Pill
                  key={g.id}
                  label={g.label}
                  active={genre === g.id}
                  onClick={() => setGenre(g.id)}
                />
              ))}
            </div>
          </section>

          {/* Platform */}
          <section className="subSection">
            <div className="subTitleRow">
              <h2 className="subTitle">Streaming Platform</h2>
              <button
                className="linkBtn"
                type="button"
                onClick={() => setShowAllPlatforms((v) => !v)}
              >
                {showAllPlatforms ? "Show less" : "See all"}
              </button>
            </div>

            <div className="pillGrid">
              {platformsToShow.map((p) => (
                <Pill
                  key={p.id}
                  label={p.label}
                  active={platform === p.id}
                  onClick={() => setPlatform(p.id)}
                />
              ))}
            </div>
          </section>

          {/* This is where your “Home / For You” sections will expand later */}
          <section className="subSection" style={{ marginTop: 22 }}>
            <h2 className="subTitle" style={{ marginBottom: 8 }}>
              {tab === "home" ? "Home" : tab === "live" ? "Live" : tab === "favs" ? "Favs" : "Search"}
            </h2>
            <div style={{ color: "rgba(255,255,255,.62)", fontSize: 14 }}>
              This area is ready for your results grid/cards next.
            </div>
          </section>
        </main>
      </div>

      {/* Bottom nav */}
      <nav className="bottomNav" aria-label="Primary navigation">
        <div className="bottomNavInner">
          <NavPill label="HOME" active={tab === "home"} onClick={() => setTab("home")} />
          <NavPill label="LIVE" active={tab === "live"} onClick={() => setTab("live")} />
          <NavPill label="FAVS" active={tab === "favs"} onClick={() => setTab("favs")} />
          <NavPill label="SEARCH" active={tab === "search"} onClick={() => setTab("search")} />
        </div>
      </nav>
    </>
  );
}

function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`pill ${active ? "pillActive" : ""}`}
      onClick={onClick}
      title={label}
    >
      <span className="smallDot" />
      <span className="pillLabel">{label}</span>
    </button>
  );
}

function NavPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`navPill ${active ? "navPillActive" : ""}`}
      onClick={onClick}
    >
      <span className="smallDot" />
      <span style={{ fontWeight: 800, letterSpacing: ".12em" }}>{label}</span>
    </button>
  );
}

