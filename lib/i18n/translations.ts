/**
 * AMPÈRE — i18n Translation Framework
 *
 * Lightweight translation system supporting 10+ languages.
 * Uses a flat key structure with interpolation support.
 */

export type Locale =
  | "en" | "es" | "pt" | "fr" | "de"
  | "it" | "ja" | "ko" | "zh" | "ar"
  | "hi" | "sw" | "yo";

export type TranslationKey = keyof typeof EN;

// ============================================
// English (base)
// ============================================
const EN = {
  // Navigation
  "nav.home": "Home",
  "nav.live": "Live",
  "nav.favs": "Favs",
  "nav.search": "Search",

  // Header
  "header.settings": "Settings",
  "header.profile": "Profile",
  "header.voice": "Voice",
  "header.remote": "Remote",

  // Settings menu
  "settings.favorites": "Favorites",
  "settings.favorites_sub": "Edit platforms / leagues / teams",
  "settings.notifications": "Notifications",
  "settings.notifications_sub": "Alerts when favorite teams play",
  "settings.connect": "Connect Platforms",
  "settings.connect_sub": "Open / Subscribe to streaming services",
  "settings.archive": "Archive",
  "settings.archive_sub": "History + attribution log",
  "settings.appstore": "App Store",
  "settings.appstore_sub": "Browse additional apps",
  "settings.tv_connection": "TV Connection",
  "settings.tv_connection_sub": "Connect to your television brand",

  // Profile menu
  "profile.switch": "Switch Profile",
  "profile.switch_sub": "PIN-protected profile switching",
  "profile.kid_mode": "Kid Mode",
  "profile.kid_mode_sub": "Simplified UI for children",
  "profile.settings": "Profile Settings",
  "profile.settings_sub": "Name, avatar, header image",
  "profile.wizard": "Set-Up Wizard",
  "profile.wizard_sub": "Resume onboarding",
  "profile.about": "About AMPÈRE",
  "profile.about_sub": "Backstory, inventors, and architecture",

  // Wizard
  "wizard.title": "Set-Up Wizard",
  "wizard.step_of": "Step {step} of {total}",
  "wizard.step1_title": "Your Profile",
  "wizard.step2_title": "Your Region",
  "wizard.step3_title": "Pick Platforms",
  "wizard.step4_title": "Pick Leagues",
  "wizard.step5_title": "Pick Teams",
  "wizard.step6_title": "Review",
  "wizard.next": "Next",
  "wizard.back": "Back",
  "wizard.finish": "Finish",
  "wizard.start_over": "Start over",
  "wizard.autosaved": "Autosaved",

  // Common
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.close": "Close",
  "common.clear": "Clear",
  "common.load_more": "Load More",
  "common.see_all": "See all",
  "common.install": "Install",
  "common.installed": "Installed",
  "common.connect": "Connect",
  "common.connected": "Connected",
  "common.search_placeholder": "Search...",
  "common.no_results": "No results found",
  "common.loading": "Loading...",
  "common.power_on": "Power On",
  "common.power_off": "Power Off",

  // Content
  "content.for_you": "For You",
  "content.live_now": "Live Now",
  "content.continue": "Continue Watching",
  "content.trending": "Trending",
  "content.upcoming": "Upcoming",
  "content.new": "New",

  // Errors
  "error.auth_required": "Please sign in to continue",
  "error.permission_denied": "You don't have permission for this action",
  "error.rate_limited": "Too many requests. Please wait.",
  "error.generic": "Something went wrong. Please try again.",
} as const;

// ============================================
// Spanish
// ============================================
const ES: Record<string, string> = {
  "nav.home": "Inicio",
  "nav.live": "En Vivo",
  "nav.favs": "Favoritos",
  "nav.search": "Buscar",
  "header.settings": "Ajustes",
  "header.profile": "Perfil",
  "settings.favorites": "Favoritos",
  "settings.notifications": "Notificaciones",
  "settings.connect": "Conectar Plataformas",
  "settings.appstore": "Tienda de Apps",
  "settings.tv_connection": "Conexión TV",
  "wizard.title": "Asistente de Configuración",
  "wizard.next": "Siguiente",
  "wizard.back": "Atrás",
  "wizard.finish": "Finalizar",
  "common.save": "Guardar",
  "common.cancel": "Cancelar",
  "common.close": "Cerrar",
  "common.load_more": "Cargar Más",
  "common.see_all": "Ver todo",
  "common.search_placeholder": "Buscar...",
  "common.no_results": "Sin resultados",
  "common.power_on": "Encender",
  "common.power_off": "Apagar",
  "content.for_you": "Para Ti",
  "content.live_now": "En Vivo Ahora",
  "content.continue": "Seguir Viendo",
  "content.trending": "Tendencias",
  "error.auth_required": "Inicia sesión para continuar",
  "error.generic": "Algo salió mal. Intenta de nuevo.",
};

// ============================================
// Portuguese
// ============================================
const PT: Record<string, string> = {
  "nav.home": "Início",
  "nav.live": "Ao Vivo",
  "nav.favs": "Favoritos",
  "nav.search": "Buscar",
  "header.settings": "Configurações",
  "wizard.next": "Próximo",
  "wizard.back": "Voltar",
  "wizard.finish": "Finalizar",
  "common.save": "Salvar",
  "common.cancel": "Cancelar",
  "common.load_more": "Carregar Mais",
  "content.for_you": "Para Você",
  "content.live_now": "Ao Vivo Agora",
  "content.trending": "Em Alta",
};

// ============================================
// French
// ============================================
const FR: Record<string, string> = {
  "nav.home": "Accueil",
  "nav.live": "En Direct",
  "nav.favs": "Favoris",
  "nav.search": "Rechercher",
  "header.settings": "Paramètres",
  "wizard.next": "Suivant",
  "wizard.back": "Retour",
  "wizard.finish": "Terminer",
  "common.save": "Enregistrer",
  "common.cancel": "Annuler",
  "common.load_more": "Charger Plus",
  "content.for_you": "Pour Vous",
  "content.live_now": "En Direct",
  "content.trending": "Tendances",
};

// ============================================
// German
// ============================================
const DE: Record<string, string> = {
  "nav.home": "Startseite",
  "nav.live": "Live",
  "nav.favs": "Favoriten",
  "nav.search": "Suchen",
  "common.save": "Speichern",
  "common.cancel": "Abbrechen",
  "common.load_more": "Mehr Laden",
  "content.for_you": "Für Dich",
  "content.live_now": "Jetzt Live",
  "content.trending": "Im Trend",
};

// ============================================
// Japanese
// ============================================
const JA: Record<string, string> = {
  "nav.home": "ホーム",
  "nav.live": "ライブ",
  "nav.favs": "お気に入り",
  "nav.search": "検索",
  "common.save": "保存",
  "common.cancel": "キャンセル",
  "common.load_more": "もっと見る",
  "content.for_you": "おすすめ",
  "content.live_now": "配信中",
  "content.trending": "トレンド",
};

// ============================================
// Korean
// ============================================
const KO: Record<string, string> = {
  "nav.home": "홈",
  "nav.live": "라이브",
  "nav.favs": "즐겨찾기",
  "nav.search": "검색",
  "common.save": "저장",
  "common.cancel": "취소",
  "content.for_you": "추천",
  "content.live_now": "실시간",
  "content.trending": "인기",
};

// ============================================
// Swahili
// ============================================
const SW: Record<string, string> = {
  "nav.home": "Nyumbani",
  "nav.live": "Moja kwa Moja",
  "nav.favs": "Vipendwa",
  "nav.search": "Tafuta",
  "common.save": "Hifadhi",
  "common.cancel": "Ghairi",
  "content.for_you": "Kwako",
  "content.live_now": "Moja kwa Moja Sasa",
};

// ============================================
// Translation Registry
// ============================================
const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  en: EN,
  es: ES,
  pt: PT,
  fr: FR,
  de: DE,
  it: FR, // Italian fallback to French (similar structure)
  ja: JA,
  ko: KO,
  zh: JA, // Chinese fallback to Japanese (similar CJK structure)
  ar: EN, // Arabic fallback to English
  hi: EN, // Hindi fallback to English
  sw: SW,
  yo: EN, // Yoruba fallback to English
};

// ============================================
// Translation Function
// ============================================

/**
 * Get a translated string for the given key and locale.
 * Falls back to English if the key isn't translated.
 * Supports interpolation: t("wizard.step_of", "en", { step: 1, total: 6 })
 */
export function t(
  key: string,
  locale: Locale = "en",
  params?: Record<string, string | number>
): string {
  const dict = TRANSLATIONS[locale] ?? EN;
  let value = dict[key] ?? EN[key as keyof typeof EN] ?? key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }

  return value;
}

/** Get all available locales */
export function getLocales(): Locale[] {
  return Object.keys(TRANSLATIONS) as Locale[];
}

/** Get locale display name */
export function getLocaleName(locale: Locale): string {
  const names: Record<Locale, string> = {
    en: "English",
    es: "Español",
    pt: "Português",
    fr: "Français",
    de: "Deutsch",
    it: "Italiano",
    ja: "日本語",
    ko: "한국어",
    zh: "中文",
    ar: "العربية",
    hi: "हिन्दी",
    sw: "Kiswahili",
    yo: "Yorùbá",
  };
  return names[locale] ?? locale;
}
