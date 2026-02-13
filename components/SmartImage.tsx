// ============================================================================
// AMPERE SMART IMAGE COMPONENT - NO BROKEN IMAGES
// File: components/SmartImage.tsx
//
// This component ensures no broken-image glyphs ever appear to users.
// It preloads image candidates and only renders after successful load.
// Shows clean fallback badges/initials if no image loads.
//
// FIXES:
// - P0: No broken-image states
// - Request #9: Genre collection images loading
// - Request #10: Channel logos in previews
// - Request #17: Header images not working
// - Request #18: Footer icons not working
// ============================================================================

"use client";

import React, { useEffect, useState, useRef } from "react";
import { preloadFirstAvailable, cacheImage, getCachedImage } from "../lib/assetPath";

// ============================================================================
// TYPES
// ============================================================================

export type FallbackType = "badge" | "initials" | "icon" | "none";

export interface SmartImageProps {
  /** Array of image paths to try (in order of preference) */
  candidates: string[];
  
  /** Alt text for the image */
  alt: string;
  
  /** Optional cache key for performance (avoids re-checking same candidates) */
  cacheKey?: string;
  
  /** Fallback rendering strategy */
  fallbackType?: FallbackType;
  
  /** Custom fallback component */
  fallback?: React.ReactNode;
  
  /** Optional className for styling */
  className?: string;
  
  /** Optional inline styles */
  style?: React.CSSProperties;
  
  /** Loading placeholder (shown while preloading) */
  loadingPlaceholder?: React.ReactNode;
  
  /** Callback when image loads successfully */
  onLoad?: (src: string) => void;
  
  /** Callback when all candidates fail to load */
  onError?: () => void;
}

// ============================================================================
// SMART IMAGE COMPONENT
// ============================================================================

export function SmartImage({
  candidates,
  alt,
  cacheKey,
  fallbackType = "badge",
  fallback,
  className = "",
  style,
  loadingPlaceholder,
  onLoad,
  onError,
}: SmartImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (candidates.length === 0) {
      setLoading(false);
      setError(true);
      return;
    }

    // Check cache first if cache key provided
    if (cacheKey) {
      const cached = getCachedImage(cacheKey);
      if (cached !== undefined) {
        setSrc(cached);
        setLoading(false);
        setError(cached === null);
        if (cached && onLoad) onLoad(cached);
        if (cached === null && onError) onError();
        return;
      }
    }

    // Preload first available candidate
    setLoading(true);
    preloadFirstAvailable(candidates)
      .then((loadedSrc) => {
        if (!mountedRef.current) return;
        
        setSrc(loadedSrc);
        setLoading(false);
        setError(loadedSrc === null);

        // Cache result if cache key provided
        if (cacheKey) {
          cacheImage(cacheKey, loadedSrc);
        }

        // Callbacks
        if (loadedSrc && onLoad) onLoad(loadedSrc);
        if (!loadedSrc && onError) onError();
      })
      .catch(() => {
        if (!mountedRef.current) return;
        
        setSrc(null);
        setLoading(false);
        setError(true);
        
        if (cacheKey) {
          cacheImage(cacheKey, null);
        }
        
        if (onError) onError();
      });
  }, [candidates.join(","), cacheKey]);

  // Show loading placeholder
  if (loading) {
    if (loadingPlaceholder) {
      return <>{loadingPlaceholder}</>;
    }
    return (
      <div 
        className={`smart-image-loading ${className}`}
        style={style}
        aria-label="Loading image"
      >
        <LoadingSpinner />
      </div>
    );
  }

  // Show image if loaded
  if (src && !error) {
    return (
      <img
        src={src}
        alt={alt}
        className={`smart-image ${className}`}
        style={style}
      />
    );
  }

  // Show fallback if error or custom fallback provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback based on type
  return (
    <FallbackRenderer
      type={fallbackType}
      text={alt}
      className={className}
      style={style}
    />
  );
}

// ============================================================================
// FALLBACK RENDERERS
// ============================================================================

interface FallbackRendererProps {
  type: FallbackType;
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

function FallbackRenderer({ type, text, className, style }: FallbackRendererProps) {
  switch (type) {
    case "badge":
      return <FallbackBadge text={text} className={className} style={style} />;
    case "initials":
      return <FallbackInitials text={text} className={className} style={style} />;
    case "icon":
      return <FallbackIcon className={className} style={style} />;
    case "none":
      return null;
    default:
      return <FallbackBadge text={text} className={className} style={style} />;
  }
}

/**
 * Badge fallback - clean text badge with gradient
 */
function FallbackBadge({ 
  text, 
  className = "", 
  style 
}: { 
  text: string; 
  className?: string; 
  style?: React.CSSProperties;
}) {
  // Get first 2-3 letters for display
  const display = text
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);

  return (
    <div
      className={`fallback-badge ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3))",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        borderRadius: "8px",
        fontSize: "0.75em",
        fontWeight: "700",
        color: "rgba(255, 255, 255, 0.9)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        width: "100%",
        height: "100%",
        minWidth: "40px",
        minHeight: "40px",
        ...style,
      }}
      title={text}
    >
      {display}
    </div>
  );
}

/**
 * Initials fallback - circular badge with initials
 */
function FallbackInitials({ 
  text, 
  className = "", 
  style 
}: { 
  text: string; 
  className?: string; 
  style?: React.CSSProperties;
}) {
  const initials = text
    .split(/\s+/)
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`fallback-initials ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(168, 85, 247, 0.4))",
        border: "2px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "50%",
        fontSize: "1em",
        fontWeight: "800",
        color: "rgba(255, 255, 255, 0.95)",
        width: "100%",
        height: "100%",
        minWidth: "48px",
        minHeight: "48px",
        aspectRatio: "1",
        ...style,
      }}
      title={text}
    >
      {initials}
    </div>
  );
}

/**
 * Icon fallback - generic image icon
 */
function FallbackIcon({ 
  className = "", 
  style 
}: { 
  className?: string; 
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`fallback-icon ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "8px",
        width: "100%",
        height: "100%",
        minWidth: "40px",
        minHeight: "40px",
        ...style,
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  );
}

/**
 * Loading spinner
 */
function LoadingSpinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        minWidth: "40px",
        minHeight: "40px",
      }}
    >
      <div
        style={{
          width: "20px",
          height: "20px",
          border: "2px solid rgba(255, 255, 255, 0.1)",
          borderTop: "2px solid rgba(255, 255, 255, 0.6)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// SPECIALIZED IMAGE COMPONENTS
// ============================================================================

/**
 * Platform logo with automatic fallback
 */
export function PlatformLogo({
  platformId,
  platformName,
  className,
  style,
}: {
  platformId: string;
  platformName: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { platformIconCandidates } = require("../lib/assetPath");
  const candidates = platformIconCandidates(platformId);

  return (
    <SmartImage
      candidates={candidates}
      alt={platformName}
      cacheKey={`platform-${platformId}`}
      fallbackType="badge"
      className={className}
      style={style}
    />
  );
}

/**
 * Genre thumbnail with automatic fallback
 */
export function GenreImage({
  genreKey,
  genreName,
  className,
  style,
}: {
  genreKey: string;
  genreName: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { genreImageCandidates } = require("../lib/assetPath");
  const candidates = genreImageCandidates(genreKey);

  return (
    <SmartImage
      candidates={candidates}
      alt={genreName}
      cacheKey={`genre-${genreKey}`}
      fallbackType="badge"
      className={className}
      style={style}
    />
  );
}

/**
 * UI Icon (header/footer) with automatic fallback
 */
export function UIIcon({
  iconName,
  location,
  className,
  style,
}: {
  iconName: string;
  location: "header" | "footer";
  className?: string;
  style?: React.CSSProperties;
}) {
  const { uiIconCandidates } = require("../lib/assetPath");
  const candidates = uiIconCandidates(iconName, location);

  return (
    <SmartImage
      candidates={candidates}
      alt={iconName}
      cacheKey={`ui-${location}-${iconName}`}
      fallbackType="icon"
      className={className}
      style={style}
    />
  );
}
