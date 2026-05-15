import React, { useState, useMemo } from 'react';
import { MODULES } from '@/core/modules';

export const Sidebar = () => {
  const [query, setQuery] = useState('');

  const onDragStart = (event: React.DragEvent, id: string) => {
    event.dataTransfer.setData('application/reactflow', id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MODULES;
    return MODULES.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.desc.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q)
    );
  }, [query]);

  const highlight = (text: string) => {
    const q = query.trim();
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{
          background: '#fef08a',
          color: '#000',
          padding: '0 2px',
          borderRadius: '3px',
          fontWeight: 900
        }}>{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <aside className="brutal-panel">
      <div className="panel-header">✏️ الأدوات المحاسبية</div>

      {/* ── Search Bar ── */}
      <div className="sidebar-search">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="بحث... (مثال: إهلاك، تعادل، NPV)"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="search-clear"
              onClick={() => setQuery('')}
              title="مسح"
            >✕</button>
          )}
        </div>
        {query && (
          <div className="search-count">
            {filtered.length > 0
              ? `🎯 ${filtered.length} نتيجة`
              : '❌ لا توجد نتائج'}
          </div>
        )}
      </div>

      <div id="mods-list" className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="search-empty">
            <div style={{ fontSize: 40 }}>🔎</div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>لا توجد أدوات مطابقة</div>
            <div style={{ fontSize: 12, color: '#888' }}>جرّب كلمة أخرى</div>
          </div>
        )}
        {filtered.map(m => (
          <div
            key={m.id}
            onDragStart={(e) => onDragStart(e, m.id)}
            draggable
            className="mod-card"
            style={{ borderRightWidth: '8px', borderRightColor: m.color }}
          >
            <div className="icon-label">
              <span>{m.icon}</span> {highlight(m.title)}
            </div>
            <div className="desc">
              {highlight(m.desc)}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
