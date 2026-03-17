import React from 'react';
import { MODULES } from '@/core/modules';

export const Sidebar = () => {
  const onDragStart = (event: React.DragEvent, id: string) => {
    event.dataTransfer.setData('application/reactflow', id);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="brutal-panel">
      <div className="panel-header">✏️ الأدوات المحاسبية</div>
      <div id="mods-list" className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {MODULES.map(m => (
          <div 
            key={m.id}
            onDragStart={(e) => onDragStart(e, m.id)}
            draggable
            className="mod-card"
            style={{ borderRightWidth: '8px', borderRightColor: m.color }}
          >
            <div className="icon-label">
              <span>{m.icon}</span> {m.title}
            </div>
            <div className="desc">
              {m.desc}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
