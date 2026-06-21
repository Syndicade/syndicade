// src/lib/designTokens.js
// Syndicade Design System tokens — source: Syndicade_Design_System.md §1 (v4.2)
// CODE RULE (§21): var only — never const/let.

// ── Core palette ──
var BG = '#F8FAFC';            // page background
var CARD = '#FFFFFF';          // cards, modals, dropdowns, search inputs
var BDR = '#E2E8F0';           // borders, dividers, skeleton edges
var ELEVATED = '#F1F5F9';      // table headers, focused inputs, alt rows, skeleton base

var BRAND_YELLOW = '#F5B731';  // decorative ONLY — never label/body text
var PRIMARY_BLUE = '#3B82F6';
var ACCENT_PURPLE = '#8B5CF6';
var SUCCESS_GREEN = '#22C55E';
var WARNING_AMBER = '#F59E0B';
var DANGER_RED = '#EF4444';

var TEXT_PRIMARY = '#0E1523';
var TEXT_SECONDARY = '#475569';
var TEXT_MUTED = '#64748B';
var TEXT_DISABLED = '#94A3B8'; // aka "Text Tertiary" in §1/§2

// ── Stat card backgrounds (§1) ──
var STAT_BLUE = '#DBEAFE';   // Members
var STAT_GREEN = '#DCFCE7';  // Events
var STAT_PURPLE = '#EDE9FE'; // Orgs

// ── Elevation (3 tiers) ──
var ELEVATION_FLAT = { border: '0.5px solid #E2E8F0', shadow: 'none', radius: '12px' };
var ELEVATION_PAPER = { border: 'none', shadow: '3px 4px 14px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)', radius: '12px' };
var ELEVATION_FLOATING = { border: '0.5px solid #E2E8F0', shadow: '0 4px 24px rgba(0,0,0,0.12)', radius: '12px' };

// ── Spacing (base unit 4px) ──
var SPACE_1 = '4px';
var SPACE_2 = '8px';
var SPACE_3 = '12px';
var SPACE_4 = '16px';
var SPACE_6 = '24px';
var SPACE_8 = '32px';
var SPACE_12 = '48px'; // py-12, section vertical rhythm
var SPACE_20 = '80px'; // py-20, hero / major sections

// ── Button (§6) ──
var BUTTON_HEIGHT = '44px';
var BUTTON_PADDING_X = '24px';
var BUTTON_FONT_WEIGHT = 600;

// ── Badge (§7) ──
var BADGE_PADDING = '2px 8px';
var BADGE_FONT = '11px / 600';
var BADGE_RADIUS = '99px';

// ── Chip (§7) ──
var CHIP_PADDING = '6px 12px';
var CHIP_FONT = '12px / 500';
var CHIP_RADIUS = '7px';
var CHIP_BORDER = '1px solid';

// ── Skeleton (§11) ──
var SKELETON_BASE = '#F1F5F9';
var SKELETON_ANIMATION = 'gradient-sweep 1.5s infinite';

// ── Toast (§5) ──
var TOAST_WIDTH_MIN = '320px';
var TOAST_WIDTH_MAX = '420px';
var TOAST_POSITION = 'top-right';
var TOAST_DURATION_SUCCESS = 4000;
var TOAST_DURATION_ERROR = 5000;
var TOAST_DURATION_LOADING = null; // indefinite

// ── Typography (§2) ──
var FONT_STACK_UI = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";
var FONT_STACK_POSTIT = "'Patrick Hand', sans-serif"; // Post-it card body only — load via Google Fonts in useEffect

var TYPE_DISPLAY_HERO = { size: '48px', weight: 800, color: '#0E1523', accentColor: '#F5B731', font: FONT_STACK_UI }; // split-color title
var TYPE_DISCOVERY_HERO_TITLE = { sizeMin: '36px', sizeMax: '40px', weight: 800, color: '#0E1523', font: FONT_STACK_UI }; // DiscoveryPageLayout only
var TYPE_PAGE_TITLE_H1 = { size: '30px', weight: 800, color: '#0E1523', font: FONT_STACK_UI }; // one per page, via PageHeader
var TYPE_SECTION_HEADER_H2 = { sizeMarketing: '32px', sizeInternal: '22px', weightMin: 700, weightMax: 800, color: '#0E1523', font: FONT_STACK_UI };
var TYPE_CARD_TITLE_H3 = { size: '15px', weight: 500, color: '#0E1523', font: FONT_STACK_UI }; // first item on every card
var TYPE_BODY = { size: '16px', weight: 400, color: '#475569', font: FONT_STACK_UI };
var TYPE_SMALL_META = { size: '13px', weight: 400, color: '#64748B', font: FONT_STACK_UI }; // dates, counts
var TYPE_HELPER_NOTE = { size: '11px', weight: 400, color: '#64748B', font: FONT_STACK_UI }; // below fields, char counts
var TYPE_FILTER_SECTION_LABEL = { size: '11px', weight: 700, color: '#64748B', font: FONT_STACK_UI }; // not yellow — fails WCAG AA
var TYPE_MODAL_FIELD_LABEL = { size: '13px', weight: 600, color: '#0E1523', font: FONT_STACK_UI, requiredAsteriskColor: '#EF4444' };
var TYPE_POSTIT_BODY = { size: '17px', weight: 400, color: '#374151', font: FONT_STACK_POSTIT };

// ── Post-it: Community Board colors (§8) ──
var POSTIT_ASK_BOARD = { cardBg: '#E1BEE7', tagBg: '#9C27B0', tagText: '#F3E5F5', tabActive: '#A78BFA' };
var POSTIT_OFFER_BOARD = { cardBg: '#C8E6C9', tagBg: '#66BB6A', tagText: '#1B5E20', tabActive: '#22C55E' };
var POSTIT_COLLABORATION_BOARD = { cardBg: '#BBDEFB', tagBg: '#42A5F5', tagText: '#0D47A1', tabActive: '#3B82F6' };
var POSTIT_TAB_INACTIVE = '#64748B';

// ── Post-it: Dashboard feed card colors (§8, incl. June 20 2026 additions) ──
var FEED_COLOR_EVENT = '#DBEAFE';
var FEED_COLOR_URGENT_ANNOUNCEMENT = '#FEE2E2';
var FEED_COLOR_REGULAR_ANNOUNCEMENT_PRESETS = ['#FEF9C3', '#DCFCE7', '#FFEDD5', '#FCE7F3', '#E0F2FE', '#F3E8FF', '#FFF7ED', '#ECFDF5']; // NOTE_PRESETS, rotates
var FEED_COLOR_DOCUMENT = '#EDE9FE';
var FEED_COLOR_POLL = '#FDE68A';
var FEED_COLOR_SURVEY = '#BAE6FD';
var FEED_COLOR_SIGNUP_FORM = '#D9F99D';
var FEED_COLOR_PROGRAM = '#DDD6FE';
var FEED_COLOR_OPPORTUNITY = '#FED7AA';
var FEED_COLOR_FUNDING = '#FEF08A';

// ── Grouped export ──
var designTokens = {
  colors: {
    BG, CARD, BDR, ELEVATED,
    BRAND_YELLOW, PRIMARY_BLUE, ACCENT_PURPLE, SUCCESS_GREEN, WARNING_AMBER, DANGER_RED,
    TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, TEXT_DISABLED
  },
  statCards: { STAT_BLUE, STAT_GREEN, STAT_PURPLE },
  elevation: { ELEVATION_FLAT, ELEVATION_PAPER, ELEVATION_FLOATING },
  spacing: { SPACE_1, SPACE_2, SPACE_3, SPACE_4, SPACE_6, SPACE_8, SPACE_12, SPACE_20 },
  button: { BUTTON_HEIGHT, BUTTON_PADDING_X, BUTTON_FONT_WEIGHT },
  badge: { BADGE_PADDING, BADGE_FONT, BADGE_RADIUS },
  chip: { CHIP_PADDING, CHIP_FONT, CHIP_RADIUS, CHIP_BORDER },
  skeleton: { SKELETON_BASE, SKELETON_ANIMATION },
  toast: {
    TOAST_WIDTH_MIN, TOAST_WIDTH_MAX, TOAST_POSITION,
    TOAST_DURATION_SUCCESS, TOAST_DURATION_ERROR, TOAST_DURATION_LOADING
  },
  typography: {
    FONT_STACK_UI, FONT_STACK_POSTIT,
    DISPLAY_HERO: TYPE_DISPLAY_HERO,
    DISCOVERY_HERO_TITLE: TYPE_DISCOVERY_HERO_TITLE,
    PAGE_TITLE_H1: TYPE_PAGE_TITLE_H1,
    SECTION_HEADER_H2: TYPE_SECTION_HEADER_H2,
    CARD_TITLE_H3: TYPE_CARD_TITLE_H3,
    BODY: TYPE_BODY,
    SMALL_META: TYPE_SMALL_META,
    HELPER_NOTE: TYPE_HELPER_NOTE,
    FILTER_SECTION_LABEL: TYPE_FILTER_SECTION_LABEL,
    MODAL_FIELD_LABEL: TYPE_MODAL_FIELD_LABEL,
    POSTIT_BODY: TYPE_POSTIT_BODY
  },
  postItBoards: {
    ASK: POSTIT_ASK_BOARD,
    OFFER: POSTIT_OFFER_BOARD,
    COLLABORATION: POSTIT_COLLABORATION_BOARD,
    TAB_INACTIVE: POSTIT_TAB_INACTIVE
  },
  feedColors: {
    EVENT: FEED_COLOR_EVENT,
    URGENT_ANNOUNCEMENT: FEED_COLOR_URGENT_ANNOUNCEMENT,
    REGULAR_ANNOUNCEMENT_PRESETS: FEED_COLOR_REGULAR_ANNOUNCEMENT_PRESETS,
    DOCUMENT: FEED_COLOR_DOCUMENT,
    POLL: FEED_COLOR_POLL,
    SURVEY: FEED_COLOR_SURVEY,
    SIGNUP_FORM: FEED_COLOR_SIGNUP_FORM,
    PROGRAM: FEED_COLOR_PROGRAM,
    OPPORTUNITY: FEED_COLOR_OPPORTUNITY,
    FUNDING: FEED_COLOR_FUNDING
  }
};

export default designTokens;
export { designTokens };