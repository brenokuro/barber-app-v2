const GOLD = "#C9A84C";
const GOLD_LIGHT = "#E8C97A";
const DARK_BG = "#0A0A0A";
const DARK_SURFACE = "#141414";
const DARK_CARD = "#1C1C1C";
const DARK_BORDER = "#2A2A2A";
const TEXT_PRIMARY = "#F5F5F5";
const TEXT_SECONDARY = "#8A8A8A";
const TEXT_MUTED = "#555555";
const SUCCESS = "#4CAF50";
const ERROR = "#E53935";
const WARNING = "#FF9800";

export const Colors = {
  gold: GOLD,
  goldLight: GOLD_LIGHT,
  background: DARK_BG,
  surface: DARK_SURFACE,
  card: DARK_CARD,
  border: DARK_BORDER,
  text: TEXT_PRIMARY,
  textSecondary: TEXT_SECONDARY,
  textMuted: TEXT_MUTED,
  success: SUCCESS,
  error: ERROR,
  warning: WARNING,
  white: "#FFFFFF",
  black: "#000000",
  statusColors: {
    pending: WARNING,
    confirmed: SUCCESS,
    cancelled: ERROR,
    completed: TEXT_SECONDARY,
  },
};

export default {
  light: {
    text: TEXT_PRIMARY,
    background: DARK_BG,
    tint: GOLD,
    tabIconDefault: TEXT_MUTED,
    tabIconSelected: GOLD,
  },
};
