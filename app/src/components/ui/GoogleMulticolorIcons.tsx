import React from 'react';
import { useSettingsStore } from '@/store/settingsStore';

interface IconProps {
  size?: number;
  className?: string;
}

// 1. Income & Cash Flow SVG (Money Bill & Coin with vibrant gradients)
export const IncomeSVG: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="billGrad" x1="4" y1="8" x2="60" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34A853" />
        <stop offset="100%" stopColor="#1B5E20" />
      </linearGradient>
      <linearGradient id="coinGrad" x1="36" y1="24" x2="60" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FBBC05" />
        <stop offset="100%" stopColor="#E65100" />
      </linearGradient>
      <linearGradient id="glassGrad" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4285F4" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#1565C0" stopOpacity="0.8" />
      </linearGradient>
      <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.15" />
      </filter>
    </defs>
    {/* Green Bill */}
    <rect x="4" y="12" width="56" height="34" rx="6" fill="url(#billGrad)" filter="url(#dropShadow)" />
    <rect x="10" y="18" width="44" height="22" rx="4" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.4" />
    <circle cx="32" cy="29" r="8" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeOpacity="0.6" />
    
    {/* Dollar Sign inside central circle */}
    <path d="M32 24v10M30 26.5h3.5a2 2 0 0 1 0 4H30.5a2 2 0 0 0 0 4H34" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    
    {/* Gold Coin Overlay */}
    <circle cx="48" cy="38" r="12" fill="url(#coinGrad)" filter="url(#dropShadow)" />
    <circle cx="48" cy="38" r="9" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.6" />
    <text x="48" y="42" fill="#FFFFFF" fontSize="12" fontWeight="bold" textAnchor="middle" style={{ fontFamily: 'Outfit' }}>$</text>
  </svg>
);

// 2. CVP Income & Document SVG (Multi-colored modern document with dynamic bars)
export const CvpIncomeSVG: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="docGrad" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#ECEFF1" />
      </linearGradient>
      <linearGradient id="chartBlue" x1="16" y1="40" x2="26" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="100%" stopColor="#1976D2" />
      </linearGradient>
      <linearGradient id="chartRed" x1="28" y1="32" x2="38" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EA4335" />
        <stop offset="100%" stopColor="#C62828" />
      </linearGradient>
      <linearGradient id="chartGreen" x1="40" y1="24" x2="50" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34A853" />
        <stop offset="100%" stopColor="#2E7D32" />
      </linearGradient>
    </defs>
    {/* Page base */}
    <rect x="8" y="4" width="48" height="56" rx="8" fill="url(#docGrad)" stroke="#B0BEC5" strokeWidth="2" />
    {/* Document header lines */}
    <rect x="16" y="12" width="24" height="4" rx="2" fill="#B0BEC5" />
    <rect x="16" y="20" width="32" height="2" rx="1" fill="#CFD8DC" />
    
    {/* Bar Chart inside document */}
    <rect x="16" y="38" width="8" height="14" rx="2" fill="url(#chartBlue)" />
    <rect x="28" y="30" width="8" height="22" rx="2" fill="url(#chartRed)" />
    <rect x="40" y="22" width="8" height="30" rx="2" fill="url(#chartGreen)" />
    
    {/* Tiny Sparkle/Star indicator for smart calculations */}
    <path d="M48 8l1.5 2.5L52 12l-2.5 1.5L48 16l-1.5-2.5L44 12l2.5-1.5z" fill="#FBBC05" />
  </svg>
);

// 3. Margin & Financial Trend SVG (Trend chart, glowing indicator and a mini calculator)
export const MarginSVG: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="chartLineGrad" x1="8" y1="48" x2="52" y2="12" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="50%" stopColor="#A066FF" />
        <stop offset="100%" stopColor="#EA4335" />
      </linearGradient>
      <linearGradient id="calcGrad" x1="36" y1="36" x2="60" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#78909C" />
        <stop offset="100%" stopColor="#37474F" />
      </linearGradient>
    </defs>
    {/* Grid Lines */}
    <path d="M8 48h48M8 36h48M8 24h48M8 12h48" stroke="#ECEFF1" strokeWidth="1.5" />
    <path d="M12 8v40M24 8v40M36 8v40M48 8v40" stroke="#ECEFF1" strokeWidth="1.5" />
    
    {/* Bottom Base */}
    <path d="M4 52h56v4H4z" fill="#CFD8DC" />

    {/* Financial curve line */}
    <path d="M8 44c10-2 14-22 24-26s16 10 24-8" stroke="url(#chartLineGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Glowing success node */}
    <circle cx="32" cy="18" r="6" fill="#34A853" />
    <circle cx="32" cy="18" r="3" fill="#FFFFFF" />

    {/* Small elegant calculator icon on bottom right */}
    <rect x="38" y="34" width="22" height="24" rx="4" fill="url(#calcGrad)" stroke="#FFFFFF" strokeWidth="1.5" />
    <rect x="42" y="38" width="14" height="6" rx="1" fill="#FFFFFF" opacity="0.9" />
    <circle cx="43" cy="48" r="1.5" fill="#FBBC05" />
    <circle cx="49" cy="48" r="1.5" fill="#FFFFFF" />
    <circle cx="55" cy="48" r="1.5" fill="#FFFFFF" />
    <circle cx="43" cy="53" r="1.5" fill="#FFFFFF" />
    <circle cx="49" cy="53" r="1.5" fill="#FFFFFF" />
    <circle cx="55" cy="53" r="1.5" fill="#EA4335" />
  </svg>
);

// 4. Break-Even & Target SVG (Sleek red/orange/yellow target with arrow in bullseye)
export const BreakEvenSVG: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="targetRed" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EA4335" />
        <stop offset="100%" stopColor="#AB000D" />
      </linearGradient>
      <linearGradient id="targetYellow" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FBBC05" />
        <stop offset="100%" stopColor="#F57C00" />
      </linearGradient>
      <linearGradient id="arrowGrad" x1="44" y1="4" x2="8" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="100%" stopColor="#0D47A1" />
      </linearGradient>
    </defs>
    {/* Target Circles */}
    <circle cx="32" cy="32" r="28" fill="url(#targetRed)" />
    <circle cx="32" cy="32" r="21" fill="#FFFFFF" />
    <circle cx="32" cy="32" r="14" fill="url(#targetYellow)" />
    <circle cx="32" cy="32" r="7" fill="#FFFFFF" />
    <circle cx="32" cy="32" r="3" fill="#34A853" />

    {/* Elegant Arrow hitting Bullseye */}
    <path d="M52 12L34 30" stroke="url(#arrowGrad)" strokeWidth="4" strokeLinecap="round" />
    <path d="M32 32l6-1-1 6z" fill="#4285F4" />
    
    {/* Arrow feathers */}
    <path d="M48 10l6-6-2 8zM52 14l6-6-8 2z" fill="#90CAF9" />
  </svg>
);

// 5. Balance Sheet & Modern Bank Vault SVG (Teal/Blue building vault signifying balance)
export const BalanceSVG: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="bankGrad" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#00ACC1" />
        <stop offset="100%" stopColor="#006064" />
      </linearGradient>
      <linearGradient id="pillarGrad" x1="0" y1="20" x2="0" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E0F7FA" />
        <stop offset="100%" stopColor="#80DEEA" />
      </linearGradient>
    </defs>
    {/* Bank Pediment (Roof) */}
    <path d="M32 6L4 20h56L32 6z" fill="url(#bankGrad)" />
    
    {/* Pediment inner detail */}
    <circle cx="32" cy="14" r="3" fill="#FBBC05" />

    {/* Columns / Pillars */}
    <rect x="10" y="22" width="6" height="30" rx="1" fill="url(#pillarGrad)" />
    <rect x="22" y="22" width="6" height="30" rx="1" fill="url(#pillarGrad)" />
    <rect x="36" y="22" width="6" height="30" rx="1" fill="url(#pillarGrad)" />
    <rect x="48" y="22" width="6" height="30" rx="1" fill="url(#pillarGrad)" />

    {/* Architrave (Beam under roof) */}
    <rect x="6" y="20" width="52" height="4" fill="#00838F" />

    {/* Stylobate (Base steps) */}
    <rect x="2" y="52" width="60" height="4" fill="url(#bankGrad)" />
    <rect x="0" y="56" width="64" height="4" fill="#006064" />

    {/* Centered Scales detail */}
    <path d="M28 28h8M32 28v14M26 36l4-6M38 36l-4-6" stroke="#FBBC05" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="26" cy="37" r="2" fill="#FBBC05" />
    <circle cx="38" cy="37" r="2" fill="#FBBC05" />
  </svg>
);

// 6. Costs & Technical Gears SVG (Gears interlocking over database blocks)
export const CostsSVG: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="gearBig" x1="12" y1="12" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EA4335" />
        <stop offset="100%" stopColor="#A81D11" />
      </linearGradient>
      <linearGradient id="gearSmall" x1="36" y1="36" x2="60" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FBBC05" />
        <stop offset="100%" stopColor="#D84315" />
      </linearGradient>
    </defs>
    {/* Big Gear */}
    <g transform="translate(26, 26)">
      <circle cx="0" cy="0" r="16" fill="url(#gearBig)" />
      {/* Teeth */}
      <path d="M-4-20h8v8h-8zM-4 12h8v8h-8zM-20-4h8v8h-8zM12-4h8v8h-8zM-15-15h6v6h-6zM9 9h6v6h-6zM-15 9h6v6h-6zM9-15h6v6h-6z" fill="url(#gearBig)" />
      {/* Center cutout */}
      <circle cx="0" cy="0" r="6" fill="#FFFFFF" />
    </g>

    {/* Small Gear */}
    <g transform="translate(48, 48)">
      <circle cx="0" cy="0" r="10" fill="url(#gearSmall)" />
      {/* Teeth */}
      <path d="M-2.5-12h5v5h-5zM-2.5 7h5v5h-5zM-12-2.5h5v5h-5zM7-2.5h5v5h-5z" fill="url(#gearSmall)" />
      <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
    </g>

    {/* Database / Blocks underneath on the left */}
    <rect x="6" y="40" width="20" height="8" rx="2" fill="#4285F4" />
    <rect x="6" y="50" width="20" height="8" rx="2" fill="#34A853" />
    <circle cx="10" cy="44" r="1.5" fill="#FFFFFF" />
    <circle cx="10" cy="54" r="1.5" fill="#FFFFFF" />
  </svg>
);

// 7. Inventory & Modern Box SVG (Sleek isometric open package in green/yellow gradients)
export const InventorySVG: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="boxFront" x1="32" y1="30" x2="8" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A2D149" />
        <stop offset="100%" stopColor="#34A853" />
      </linearGradient>
      <linearGradient id="boxSide" x1="32" y1="30" x2="56" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#81C784" />
        <stop offset="100%" stopColor="#1B5E20" />
      </linearGradient>
      <linearGradient id="boxInside" x1="32" y1="30" x2="32" y2="10" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFE082" />
        <stop offset="100%" stopColor="#FBBC05" />
      </linearGradient>
    </defs>
    {/* Shadow */}
    <ellipse cx="32" cy="54" rx="20" ry="6" fill="#CFD8DC" />

    {/* Isometric Box Base */}
    {/* Inside face */}
    <path d="M32 30L8 18l24-12 24 12z" fill="url(#boxInside)" />
    
    {/* Left Front Face */}
    <path d="M32 30v24L8 42V18z" fill="url(#boxFront)" />
    
    {/* Right Front Face */}
    <path d="M32 30v24l24-12V18z" fill="url(#boxSide)" />

    {/* Left Flap (Open Box top detail) */}
    <path d="M8 18L0 6l24 12z" fill="#C5E1A5" opacity="0.9" />
    {/* Right Flap */}
    <path d="M56 18l8-12-24 12z" fill="#A5D6A7" opacity="0.9" />

    {/* Centered Package Tape/Stamp */}
    <path d="M32 30l8 4v6l-8-4z" fill="#FBBC05" opacity="0.8" />
  </svg>
);

// 8. Decision Maker & Split Arrows SVG (Purple/Orange dynamic fork)
export const DecisionSVG: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="arrowL" x1="32" y1="52" x2="8" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#AB47BC" />
        <stop offset="100%" stopColor="#E1BEE7" />
      </linearGradient>
      <linearGradient id="arrowR" x1="32" y1="52" x2="56" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FF7043" />
        <stop offset="100%" stopColor="#FFE0B2" />
      </linearGradient>
    </defs>
    {/* Split intersection roads */}
    <path d="M32 58V34" stroke="#78909C" strokeWidth="12" strokeLinecap="round" />
    
    {/* Left Path Fork */}
    <path d="M32 38C22 38 12 28 12 16" stroke="url(#arrowL)" strokeWidth="10" strokeLinecap="round" fill="none" />
    <path d="M12 10l-6 10h12z" fill="#AB47BC" transform="rotate(-35 12 16)" />

    {/* Right Path Fork */}
    <path d="M32 38C42 38 52 28 52 16" stroke="url(#arrowR)" strokeWidth="10" strokeLinecap="round" fill="none" />
    <path d="M52 10l-6 10h12z" fill="#FF7043" transform="rotate(35 52 16)" />

    {/* Centered Question Mark sign/badge */}
    <circle cx="32" cy="34" r="8" fill="#FBBC05" stroke="#FFFFFF" strokeWidth="2" />
    <text x="32" y="39" fill="#FFFFFF" fontSize="14" fontWeight="bold" textAnchor="middle" style={{ fontFamily: 'Outfit' }}>?</text>
  </svg>
);

// 9. Labor & Personnel SVG (Vibrant worker with hardhat avatar in blue/orange circle)
export const LaborSVG: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="userGrad" x1="32" y1="32" x2="32" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="100%" stopColor="#1565C0" />
      </linearGradient>
      <linearGradient id="hatGrad" x1="16" y1="18" x2="48" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FBBC05" />
        <stop offset="100%" stopColor="#EF6C00" />
      </linearGradient>
    </defs>
    {/* Circular Background */}
    <circle cx="32" cy="32" r="30" fill="#E8F0FE" />

    {/* Person Body */}
    <path d="M12 56c0-10 8-18 20-18s20 8 20 18" fill="url(#userGrad)" />
    
    {/* Neck */}
    <rect x="28" y="32" width="8" height="8" fill="#FFD54F" />

    {/* Face */}
    <circle cx="32" cy="25" r="10" fill="#FFD54F" />

    {/* Hardhat / Safety Helmet */}
    <path d="M18 22c0-8 6-12 14-12s14 4 14 12z" fill="url(#hatGrad)" />
    <rect x="14" y="21" width="36" height="3" rx="1.5" fill="#EF6C00" />
    {/* Helmet ridge */}
    <path d="M30 10h4v12h-4z" fill="#FBBC05" />

    {/* Eyes */}
    <circle cx="28" cy="25" r="1.5" fill="#37474F" />
    <circle cx="36" cy="25" r="1.5" fill="#37474F" />
  </svg>
);

// 10. Zakat & Moon Dome SVG (Intricate gold crescent moon and glowing emerald dome)
export const ZakatSVG: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="zakatDome" x1="16" y1="28" x2="48" y2="52" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34A853" />
        <stop offset="100%" stopColor="#0B5E20" />
      </linearGradient>
      <linearGradient id="moonGrad" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFE082" />
        <stop offset="50%" stopColor="#FBBC05" />
        <stop offset="100%" stopColor="#F57C00" />
      </linearGradient>
    </defs>
    {/* Mosque Base / Pillars */}
    <rect x="12" y="46" width="40" height="10" rx="2" fill="#CFD8DC" />
    <rect x="16" y="38" width="32" height="8" fill="#ECEFF1" />
    <path d="M20 38V28h4v10M40 38V28h4v10" stroke="#B0BEC5" strokeWidth="2" />

    {/* Emerald Dome */}
    <path d="M22 28c0-10 5-14 10-14s10 4 10 14z" fill="url(#zakatDome)" />

    {/* Glowing Crescent Moon wrapper */}
    <path d="M48 10C36 10 24 22 24 38c0 14 10 22 22 22 3 0 6-1 8-2.5-6 1.5-14-1.5-18-9.5s1-18.5 7.5-23c4-2.5 8-3.5 11.5-3-2.5-1-4.5-2-7-2z" fill="url(#moonGrad)" filter="drop-shadow(0px 2px 4px rgba(251,188,5,0.3))" />
    
    {/* Tiny floating star */}
    <path d="M32 6l1 2h2l-1.5 1 0.5 2-2-1.5-2 1.5 0.5-2-1.5-1h2z" fill="#FBBC05" />
  </svg>
);

// 11. Currency Exchange SVG (Sleek circle exchange loops in blue/emerald gradient)
export const CurrencySVG: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="swapBlue" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#29B6F6" />
        <stop offset="100%" stopColor="#0288D1" />
      </linearGradient>
      <linearGradient id="swapGreen" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#66BB6A" />
        <stop offset="100%" stopColor="#388E3C" />
      </linearGradient>
    </defs>
    {/* Circular arrows */}
    <path d="M32 8c12 0 22 8 24 20" stroke="url(#swapBlue)" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M56 28l4-8-8 2z" fill="#0288D1" />

    <path d="M32 56C20 56 10 48 8 36" stroke="url(#swapGreen)" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M8 36l-4 8 8-2z" fill="#388E3C" />

    {/* Center Currency Symbols */}
    <circle cx="23" cy="26" r="10" fill="#4285F4" />
    <text x="23" y="31" fill="#FFFFFF" fontSize="13" fontWeight="bold" textAnchor="middle" style={{ fontFamily: 'Outfit' }}>$</text>

    <circle cx="41" cy="38" r="10" fill="#34A853" />
    <text x="41" y="43" fill="#FFFFFF" fontSize="12" fontWeight="bold" textAnchor="middle" style={{ fontFamily: 'Cairo' }}>ج</text>
  </svg>
);

// 12. Shield & Margin of Safety SVG (Safe protection badge in steel blue and gold)
export const ShieldSVG: React.FC<IconProps> = ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="shieldGrad" x1="8" y1="4" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="100%" stopColor="#0D47A1" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FBBC05" />
        <stop offset="100%" stopColor="#EF6C00" />
      </linearGradient>
    </defs>
    {/* Shield Base Shape */}
    <path d="M32 4c16 0 24 8 24 24 0 14-10 24-24 28C18 52 8 42 8 28 8 12 16 4 32 4z" fill="url(#shieldGrad)" stroke="#FFFFFF" strokeWidth="2.5" filter="drop-shadow(0px 3px 6px rgba(13,71,161,0.25))" />
    
    {/* Inner golden shield badge */}
    <path d="M32 10c11 0 17 6 17 18 0 10-7 18-17 21-10-3-17-11-17-21 0-12 6-18 17-18z" fill="url(#goldGrad)" opacity="0.9" />

    {/* Tick / Checkmark of perfect safety inside shield */}
    <path d="M24 28l6 6 12-12" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Dictionary mapping each accounting Module ID to its gorgeous multicolor SVG component
const GOOGLE_ICON_MAP: Record<string, React.FC<IconProps>> = {
  income: IncomeSVG,
  cvp_income: CvpIncomeSVG,
  gmargin: MarginSVG,
  breakeven: BreakEvenSVG,
  balance: BalanceSVG,
  roi: MarginSVG,
  mixed_cost: CostsSVG,
  target_sales: BreakEvenSVG,
  mos: ShieldSVG, // Beautiful Margin of Safety shield!
  op_leverage: MarginSVG,
  prod_budget: InventorySVG,
  mat_budget: InventorySVG,
  make_buy: DecisionSVG,
  drop_keep: DecisionSVG,
  sales_budget: CvpIncomeSVG,
  liquidity: MarginSVG,
  cogs: CostsSVG,
  total_vc: CostsSVG,
  vc_pu: stroke => <CostsSVG {...stroke} />,
  depreciation: InventorySVG,
  special_order: CvpIncomeSVG,
  sell_or_process: DecisionSVG,
  labor_budget: LaborSVG,
  quick_ratio: MarginSVG,
  roe: MarginSVG,
  inventory_turnover: InventorySVG,
  receivables_turnover: CvpIncomeSVG,
  asset_turnover: InventorySVG,
  debt_equity: MarginSVG,
  net_margin: MarginSVG,
  eps: MarginSVG,
  working_capital: BalanceSVG,
  cash_flow: IncomeSVG,
  equity_statement: CvpIncomeSVG,
  opex_budget: CvpIncomeSVG,
  cash_budget: BalanceSVG,
  overhead_budget: CostsSVG,
  material_variance: CostsSVG,
  labor_variance: LaborSVG,
  overhead_variance: CostsSVG,
  standard_cost: CvpIncomeSVG,
  absorption_variable: CostsSVG,
  multi_bep: BreakEvenSVG,
  tvm: MarginSVG,
  annuity: MarginSVG,
  dupont: MarginSVG,
  dep_declining: InventorySVG,
  dep_syd: InventorySVG,
  dep_units: InventorySVG,
  constraint: DecisionSVG,
  payback: MarginSVG,
  npv: IncomeSVG,
  vat: ZakatSVG,
  zakat: ZakatSVG,
  currency: CurrencySVG,
  horizontal_analysis: CvpIncomeSVG,
  vertical_analysis: CvpIncomeSVG,
};

interface GoogleIconWrapperProps extends IconProps {
  id: string;
  fallbackEmoji?: string;
}

/**
 * Smart GoogleIcon Component:
 * - Renders the gorgeous SVGBepo-style Multicolor SVGs under Google theme.
 * - Falls back cleanly to rendering the standard Arabic/Emoji in Brutalist & Quiet themes.
 */
export const GoogleIcon: React.FC<GoogleIconWrapperProps> = ({ id, fallbackEmoji, className, size = 24 }) => {
  const theme = useSettingsStore(state => state.theme);
  const isGoogle = theme === 'google';

  if (!isGoogle) {
    return <span className={className} style={{ fontSize: size - 4, display: 'inline-flex', alignItems: 'center' }}>{fallbackEmoji}</span>;
  }

  const Comp = GOOGLE_ICON_MAP[id];
  if (!Comp) {
    // If somehow no map entry is found, fallback gracefully
    return <span className={className} style={{ fontSize: size - 4, display: 'inline-flex', alignItems: 'center' }}>{fallbackEmoji}</span>;
  }

  return <Comp size={size} className={className} />;
};
