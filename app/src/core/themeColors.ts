// Node color families for Google Theme
export type GoogleColorFamily = 'blue' | 'green' | 'yellow' | 'red';

// Single Source of Truth for Google Theme Colors
export interface NodeColorPalette {
  primary: string;      // The solid Google color
  lightBg: string;      // Pastel/Tinted color for backgrounds or badge backgrounds
  softBg: string;       // Extremely light background tint for status messages or input headers
}

const GOOGLE_PALETTE: Record<GoogleColorFamily, { light: NodeColorPalette; dark: NodeColorPalette }> = {
  blue: {
    light: { primary: '#1a73e8', lightBg: '#e8f0fe', softBg: '#f1f3f4' },
    dark: { primary: '#1a73e8', lightBg: '#1a273a', softBg: '#202124' }
  },
  green: {
    light: { primary: '#34a853', lightBg: '#e6f4ea', softBg: '#f8f9fa' },
    dark: { primary: '#34a853', lightBg: '#0f341e', softBg: '#202124' }
  },
  yellow: {
    light: { primary: '#fbbc05', lightBg: '#fef7e0', softBg: '#f8f9fa' },
    dark: { primary: '#fbbc05', lightBg: '#3e2723', softBg: '#202124' }
  },
  red: {
    light: { primary: '#ea4335', lightBg: '#fce8e6', softBg: '#f8f9fa' },
    dark: { primary: '#ea4335', lightBg: '#3c1e22', softBg: '#202124' }
  }
};

// Detailed unique palettes for each module in Google theme to provide distinct, harmonious colors.
export const GOOGLE_MODULE_PALETTES: Record<string, { light: NodeColorPalette; dark: NodeColorPalette }> = {
  // --- BLUE GROUP (Statements, Liquidity) ---
  income: {
    light: { primary: '#1a73e8', lightBg: '#e8f0fe', softBg: '#d2e3fc' }, // Google Blue
    dark: { primary: '#8ab4f8', lightBg: '#1a273a', softBg: '#1e3a5f' }
  },
  cvp_income: {
    light: { primary: '#3f51b5', lightBg: '#e8eaf6', softBg: '#c5cae9' }, // Indigo
    dark: { primary: '#9fa8da', lightBg: '#1c2331', softBg: '#283593' }
  },
  balance: {
    light: { primary: '#1565c0', lightBg: '#e3f2fd', softBg: '#bbdefb' }, // Deep Blue
    dark: { primary: '#90caf9', lightBg: '#0d253f', softBg: '#1565c0' }
  },
  sales_budget: {
    light: { primary: '#00838f', lightBg: '#e0f7fa', softBg: '#b2ebf2' }, // Teal-Blue
    dark: { primary: '#80deea', lightBg: '#002d33', softBg: '#006064' }
  },
  roi: {
    light: { primary: '#0288d1', lightBg: '#e1f5fe', softBg: '#b3e5fc' }, // Sky Blue
    dark: { primary: '#81d4fa', lightBg: '#092c3e', softBg: '#0288d1' }
  },
  liquidity: {
    light: { primary: '#6a1b9a', lightBg: '#f3e5f5', softBg: '#e1bee7' }, // Purple
    dark: { primary: '#ce93d8', lightBg: '#280c35', softBg: '#6a1b9a' }
  },

  // --- GREEN GROUP (Profitability & Break-Even) ---
  gmargin: {
    light: { primary: '#2e7d32', lightBg: '#e8f5e9', softBg: '#c8e6c9' }, // Google Green
    dark: { primary: '#81c995', lightBg: '#0f341e', softBg: '#1b5e20' }
  },
  breakeven: {
    light: { primary: '#00695c', lightBg: '#e0f2f1', softBg: '#b2dfdb' }, // Teal
    dark: { primary: '#4db6ac', lightBg: '#002b26', softBg: '#004d40' }
  },
  target_sales: {
    light: { primary: '#558b2f', lightBg: '#f1f8e9', softBg: '#dcedc8' }, // Light Green
    dark: { primary: '#a5d6a7', lightBg: '#1b2d11', softBg: '#33691e' }
  },
  mos: {
    light: { primary: '#00796b', lightBg: '#e0f2f1', softBg: '#b2dfdb' }, // Dark Teal
    dark: { primary: '#80cbc4', lightBg: '#002d28', softBg: '#004d40' }
  },
  op_leverage: {
    light: { primary: '#4caf50', lightBg: '#e8f5e9', softBg: '#c8e6c9' }, // Lime Green
    dark: { primary: '#a5d6a7', lightBg: '#0f341e', softBg: '#1b5e20' }
  },

  // --- YELLOW GROUP (Activity, Depreciation, Operations) ---
  prod_budget: {
    light: { primary: '#e65100', lightBg: '#fff3e0', softBg: '#ffe0b2' }, // Google Orange
    dark: { primary: '#ffb74d', lightBg: '#3e2723', softBg: '#e65100' }
  },
  depreciation: {
    light: { primary: '#f57f17', lightBg: '#fffde7', softBg: '#fff9c4' }, // Google Yellow
    dark: { primary: '#ffd54f', lightBg: '#3c2f12', softBg: '#f57f17' }
  },
  mixed_cost: {
    light: { primary: '#ff8f00', lightBg: '#fff8e1', softBg: '#ffe0b2' }, // Warm Yellow / Gold
    dark: { primary: '#ffe082', lightBg: '#3a2b0e', softBg: '#ff8f00' }
  },

  // --- RED GROUP (Costs & Decisions) ---
  cogs: {
    light: { primary: '#c62828', lightBg: '#ffebee', softBg: '#ffcdd2' }, // Google Red
    dark: { primary: '#f28b82', lightBg: '#3c1e22', softBg: '#b71c1c' }
  },
  mat_budget: {
    light: { primary: '#d84315', lightBg: '#fbe9e7', softBg: '#ffccbc' }, // Terracotta
    dark: { primary: '#ffab91', lightBg: '#441d13', softBg: '#bf360c' }
  },
  make_buy: {
    light: { primary: '#c2185b', lightBg: '#fce4ec', softBg: '#f8bbd0' }, // Pink / Rose
    dark: { primary: '#f48fb1', lightBg: '#451025', softBg: '#880e4f' }
  },
  drop_keep: {
    light: { primary: '#ad1457', lightBg: '#fce4ec', softBg: '#f8bbd0' }, // Magenta
    dark: { primary: '#f48fb1', lightBg: '#3f0d23', softBg: '#880e4f' }
  },
  special_order: {
    light: { primary: '#e64a19', lightBg: '#fbe9e7', softBg: '#ffccbc' }, // Orange Red
    dark: { primary: '#ff7043', lightBg: '#441d13', softBg: '#bf360c' }
  },
  sell_or_process: {
    light: { primary: '#880e4f', lightBg: '#fce4ec', softBg: '#f8bbd0' }, // Plum / Wine
    dark: { primary: '#f48fb1', lightBg: '#3a001a', softBg: '#880e4f' }
  },
  total_vc: {
    light: { primary: '#b71c1c', lightBg: '#ffebee', softBg: '#ffcdd2' }, // Dark Red
    dark: { primary: '#e57373', lightBg: '#4a1515', softBg: '#b71c1c' }
  },
  vc_pu: {
    light: { primary: '#c2185b', lightBg: '#fce4ec', softBg: '#f8bbd0' }, // Pink Accent
    dark: { primary: '#f48fb1', lightBg: '#451025', softBg: '#880e4f' }
  }
};

// Logical grouping of modules by Google brand color
export const MODULE_COLOR_GROUPS: Record<string, GoogleColorFamily> = {
  // Blue Group (Statements, Core Structure, Liquidity)
  income: 'blue',
  cvp_income: 'blue',
  balance: 'blue',
  sales_budget: 'blue',
  roi: 'blue',
  liquidity: 'blue',

  // Green Group (Profitability margins, targets, break-even)
  gmargin: 'green',
  breakeven: 'green',
  target_sales: 'green',
  mos: 'green',
  op_leverage: 'green',

  // Yellow Group (Operations, Depreciation, Activity)
  prod_budget: 'yellow',
  depreciation: 'yellow',
  mixed_cost: 'yellow',

  // Red Group (Costs, Materials, Decisions)
  cogs: 'red',
  mat_budget: 'red',
  make_buy: 'red',
  drop_keep: 'red',
  special_order: 'red',
  sell_or_process: 'red',
  total_vc: 'red',
  vc_pu: 'red'
};

export interface NodeThemeStyle {
  primaryColor: string;
  lightBg: string;
  softBg: string;
  cardBg: string;
  borderColor: string;
  textColor: string;
  textSecondary: string;
  inputBg: string;
  inputText: string;
  inputBorder: string;
  inputFocusBorder: string;
  badgeBg: string;
  badgeText: string;
  decisionBg: string;
  decisionText: string;
  errorBg: string;
  errorText: string;
}

/**
 * Returns accurate flat colors for the Google Theme, or falls back to
 * default brutalist colors for other themes to preserve layout compatibility.
 */
export function getNodeThemeStyle(
  defId: string,
  theme: string,
  isDark: boolean,
  defaultColor: string
): NodeThemeStyle {
  const isGoogle = theme === 'google';

  if (!isGoogle) {
    // Return brutalist default mappings (Brutalist values)
    return {
      primaryColor: defaultColor,
      lightBg: defaultColor,
      softBg: '#ffffff',
      cardBg: '#ffffff',
      borderColor: '#000000',
      textColor: '#000000',
      textSecondary: '#4b5563',
      inputBg: '#ffffff',
      inputText: '#000000',
      inputBorder: '#000000',
      inputFocusBorder: '#000000',
      badgeBg: '#e2e8f0',
      badgeText: '#000000',
      decisionBg: '#ecfdf5',
      decisionText: '#047857',
      errorBg: '#fef2f2',
      errorText: '#b91c1c'
    };
  }

  // Google Theme Mode
  const colorGroup = MODULE_COLOR_GROUPS[defId] || 'blue';
  
  // Use specific module palette if defined, otherwise fall back to category palette
  const modulePalette = GOOGLE_MODULE_PALETTES[defId];
  const palette = modulePalette 
    ? modulePalette[isDark ? 'dark' : 'light']
    : GOOGLE_PALETTE[colorGroup][isDark ? 'dark' : 'light'];

  return {
    primaryColor: palette.primary,
    lightBg: palette.lightBg,
    softBg: palette.softBg,
    cardBg: isDark ? '#2d2f31' : '#ffffff',
    borderColor: isDark ? '#3c4043' : '#dadce0',
    textColor: isDark ? '#e8eaed' : '#202124',
    textSecondary: isDark ? '#9aa0a6' : '#5f6368',
    inputBg: isDark ? '#202124' : '#ffffff',
    inputText: isDark ? '#e8eaed' : '#202124',
    inputBorder: isDark ? '#3c4043' : '#dadce0',
    inputFocusBorder: palette.primary,
    badgeBg: palette.lightBg,
    badgeText: palette.primary,
    decisionBg: isDark ? '#0f341e' : '#e6f4ea',
    decisionText: isDark ? '#81c995' : '#137333',
    errorBg: isDark ? '#3c1e22' : '#fce8e6',
    errorText: isDark ? '#f28b82' : '#c5221f'
  };
}
