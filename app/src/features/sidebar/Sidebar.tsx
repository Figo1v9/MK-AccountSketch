import React, { useState, useMemo, useRef } from 'react';
import { MODULES } from '@/core/modules';
import { useTranslation, useDynamicTranslation, useI18nStore } from '@/lib/i18n';
import { useAccountActions } from '@/store/accountStore';
import { useReactFlow } from '@xyflow/react';
import { useSettingsStore } from '@/store/settingsStore';
import { GoogleIcon } from '@/components/ui/GoogleMulticolorIcons';
import { getNodeThemeStyle, MODULE_COLOR_GROUPS } from '@/core/themeColors';
import { Pencil, Search, X, SearchX, ChevronLeft, TrendingUp, Target, PieChart, Landmark } from 'lucide-react';

const CATEGORY_NAMES = {
  ar: {
    blue: 'السيولة والقوائم',
    green: 'الربحية والتعادل',
    yellow: 'النشاط والإهلاك',
    red: 'التكاليف والقرارات',
  },
  en: {
    blue: 'Liquidity & Statements',
    green: 'Profitability & B.E.',
    yellow: 'Activity & Depr.',
    red: 'Costs & Decisions',
  }
};

export const Sidebar = () => {
  const [query, setQuery] = useState('');
  const t = useTranslation();
  const td = useDynamicTranslation();
  const { addNode } = useAccountActions();
  const { screenToFlowPosition } = useReactFlow();
  const isDragging = useRef(false);
  const theme = useSettingsStore(state => state.theme);
  const darkMode = useSettingsStore(state => state.darkMode);
  const lang = useI18nStore(state => state.lang);

  const onDragStart = (event: React.DragEvent, id: string) => {
    isDragging.current = true;
    event.dataTransfer.setData('application/reactflow', id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragEnd = () => {
    setTimeout(() => {
      isDragging.current = false;
    }, 100);
  };

  const handleCardClick = (defId: string) => {
    if (isDragging.current) return;

    // Dynamically calculate the visual center of the window in canvas space
    const center = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const position = {
      x: center.x + (Math.random() - 0.5) * 40,
      y: center.y + (Math.random() - 0.5) * 40,
    };

    const newNode = {
      id: `${defId}_${Date.now()}`,
      type: 'brutalNode',
      position,
      data: { defId, vals: {}, calcKeys: [], manualKeys: [] },
    };

    addNode(newNode as any);
  };


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MODULES;
    return MODULES.filter(m =>
      td(m.title).toLowerCase().includes(q) ||
      td(m.desc).toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q)
    );
  }, [query, td]);

  const highlight = (text: string) => {
    const q = query.trim();
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{
          background: 'rgba(16, 185, 129, 0.15)',
          color: 'inherit',
          padding: '1px 3px',
          borderRadius: '4px',
          fontWeight: 900,
          borderBottom: '2px solid rgba(16, 185, 129, 0.5)'
        }}>{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <aside className="brutal-panel">
      <div className="panel-header"><Pencil size={16} strokeWidth={2.5} style={{ display: 'inline', verticalAlign: '-2px', marginInlineEnd: '6px' }} />{t('sidebar.title')}</div>

      {/* ── Search Bar ── */}
      <div className="sidebar-search">
        <div className="search-input-wrap">
          <Search size={14} strokeWidth={2.5} className="search-icon" style={{ flexShrink: 0, opacity: 0.45 }} />
          <input
            type="text"
            className="search-input"
            placeholder={t('sidebar.search_placeholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="search-clear"
              onClick={() => setQuery('')}
              title={t('sidebar.clear')}
            ><X size={12} strokeWidth={3} /></button>
          )}
        </div>
        {query && (
          <div className={`search-count ${filtered.length > 0 ? 'search-count--found' : 'search-count--empty'}`}>
            {filtered.length > 0
              ? `${filtered.length} ${t('sidebar.results')}`
              : t('sidebar.no_results')}
          </div>
        )}
      </div>

      <div id="mods-list" className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="search-empty">
            <SearchX size={36} strokeWidth={1.5} style={{ opacity: 0.35 }} />
            <div style={{ fontWeight: 800, fontSize: 14 }}>{t('sidebar.no_match')}</div>
            <div style={{ fontSize: 12, opacity: 0.5 }}>{t('sidebar.try_another')}</div>
          </div>
        )}
        {filtered.map(m => {
          const style = getNodeThemeStyle(m.id, theme, darkMode, m.color);

          if (theme === 'google') {
            const colorGroup = MODULE_COLOR_GROUPS[m.id] || 'blue';
            const categoryText = (CATEGORY_NAMES[lang] as Record<string, string>)[colorGroup] || colorGroup;
            const CategoryIcon = colorGroup === 'blue' ? Landmark : colorGroup === 'green' ? TrendingUp : colorGroup === 'yellow' ? Target : PieChart;
            
            return (
              <div
                key={m.id}
                data-def-id={m.id}
                onDragStart={(e) => onDragStart(e, m.id)}
                onDragEnd={onDragEnd}
                draggable
                onClick={() => handleCardClick(m.id)}
                className="mod-card cursor-pointer select-none rounded-[24px] px-2 h-[88px] flex items-center transition-all duration-300 group"
                style={{
                  backgroundColor: style.lightBg,
                  color: style.textColor,
                  border: `1px solid ${style.borderColor}`,
                  borderInlineStart: `6px solid ${style.primaryColor}`,
                }}
              >
                {/* Left Icon Area with Arc */}
                <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                  {/* Arc Effect */}
                  <div 
                    className="absolute inset-0 rounded-full border-[2px] transition-transform duration-500 group-hover:rotate-45"
                    style={{ 
                      borderColor: style.primaryColor + '50', 
                      borderRightColor: 'transparent',
                      opacity: 0.85,
                      transform: 'rotate(-45deg)'
                    }}
                  ></div>
                  {/* Arc Dot */}
                  <div 
                    className="absolute w-1.5 h-1.5 rounded-full right-[2px] top-[15%] transition-transform duration-500 group-hover:translate-x-1"
                    style={{ backgroundColor: style.primaryColor }}
                  ></div>
                  
                  {/* Inner Tinted Circle */}
                  <div 
                    className="w-11 h-11 rounded-full flex items-center justify-center z-10 transition-transform duration-300 group-hover:scale-105 shadow-sm" 
                    style={{ backgroundColor: style.cardBg }}
                  >
                    <GoogleIcon id={m.id} fallbackEmoji={m.icon} size={22} />
                  </div>
                </div>

                {/* Middle Content */}
                <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-2">
                  {/* Category Badge */}
                  <div 
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full mb-1.5"
                    style={{ backgroundColor: style.softBg, color: style.primaryColor }}
                  >
                    <CategoryIcon size={10} strokeWidth={3} />
                    <span className="text-[8.5px] font-extrabold uppercase tracking-widest leading-none mt-0.5">{categoryText}</span>
                  </div>
                  
                  {/* Title - Fixed line-clamp for uniformity */}
                  <h4 
                    className="text-[14.5px] font-black text-center leading-[1.25] line-clamp-2 w-full px-1" 
                    style={{ fontFamily: 'Outfit, Cairo, sans-serif', color: style.textColor }}
                  >
                    {highlight(td(m.title))}
                  </h4>
                </div>

                {/* Right Action Button */}
                <div className="shrink-0 ml-1">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:-translate-x-1 group-hover:bg-opacity-80 shadow-sm"
                    style={{ backgroundColor: style.softBg, color: style.primaryColor }}
                  >
                    <ChevronLeft size={16} strokeWidth={2.5} className="mr-0.5" />
                  </div>
                </div>
              </div>
            );
          }

          const colorGroup = MODULE_COLOR_GROUPS[m.id] || 'blue';
          const categoryText = (CATEGORY_NAMES[lang] as Record<string, string>)[colorGroup] || colorGroup;

          return (
            <div
              key={m.id}
              data-def-id={m.id}
              onDragStart={(e) => onDragStart(e, m.id)}
              onDragEnd={onDragEnd}
              draggable
              onClick={() => handleCardClick(m.id)}
              className="mod-card cursor-pointer select-none transition-all"
              style={{
                borderInlineStart: `4px solid ${m.color}`,
                padding: '10px 12px',
              }}
            >
              {/* Category Badge */}
              <div className="flex justify-between items-center mb-1.5">
                <span 
                  className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide select-none"
                  style={{ backgroundColor: `${m.color}20`, color: m.color }}
                >
                  {categoryText}
                </span>
                <span className="text-[10px] opacity-25 select-none cursor-grab font-bold">⋮⋮</span>
              </div>

              {/* Icon + Title + Desc Row */}
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${m.color}18` }}
                >
                  <GoogleIcon id={m.id} fallbackEmoji={m.icon} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-extrabold leading-tight truncate">
                    {highlight(td(m.title))}
                  </div>
                  <div className="text-[10.5px] font-semibold leading-snug mt-0.5 line-clamp-2" style={{ opacity: 0.55 }}>
                    {highlight(td(m.desc))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
