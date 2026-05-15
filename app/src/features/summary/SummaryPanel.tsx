import { useAccountStore } from '@/store/accountStore';
import { MODULES } from '@/core/modules';
import { formatCurrency } from '@/lib/utils';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { generatePDF } from '@/lib/pdfExport';
import { exportToExcelCSV } from '@/features/excel/excelUtils';

export const SummaryPanel = () => {
  const { nodes } = useAccountStore();
  
  const activeNodes = nodes.filter(n => 
    Object.values(n.data.vals).some(v => v !== null && v !== undefined)
  );

  const handleCopy = () => {
    let out = "📊 تقرير AccountSketch المباشر\n" + "=".repeat(30) + "\n\n";
    activeNodes.forEach(m => {
        const def = MODULES.find(d => d.id === m.data.defId);
        if(!def) return;
        out += `[ ${def.title} ]\n`;
        def.fields.forEach(f => { 
            const val = m.data.vals[f.k];
            if(val !== null && val !== undefined) {
                out += `• ${f.l}: ${formatCurrency(val)} ${f.u}\n`; 
            }
        });
        out += "\n";
    });
    navigator.clipboard.writeText(out);
    alert('📋 تم نسخ النتائج إلى الحافظة');
  };

  return (
    <aside className="brutal-panel relative">
      <div className="panel-header flex justify-between items-center" style={{ textAlign: 'left', display: 'flex' }}>
        <span className="flex-1 text-center">📈 النتائج المباشرة</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button 
            onClick={() => generatePDF(nodes)} 
            title="حفظ كـ PDF" 
            className="bg-white text-black p-1 hover:bg-emerald-300 border-2 border-black rounded-md active:translate-y-1 transition-transform"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontWeight: 700, fontSize: 12 }}
          >
            <FileText size={16} strokeWidth={3} />
            PDF
          </button>
          <button 
            onClick={() => exportToExcelCSV(nodes)} 
            title="تصدير إلى Excel / CSV" 
            className="bg-white text-black p-1 hover:bg-blue-300 border-2 border-black rounded-md active:translate-y-1 transition-transform"
          >
            <FileSpreadsheet size={18} strokeWidth={3} />
          </button>
          <button onClick={handleCopy} title="نسخ التقرير" className="bg-white text-black p-1 hover:bg-yellow-300 border-2 border-black rounded-md active:translate-y-1 transition-transform">
            <Download size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
      <div id="rcon" className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 relative">
        {activeNodes.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '60px', fontWeight: 700, opacity: 0.4 }}>
                ضع وحدات وأدخل أرقاماً<br/>لرؤية التحليل هنا
            </div>
        ) : (
            activeNodes.map(m => {
                const def = MODULES.find(d => d.id === m.data.defId);
                if (!def) return null;
                return (
                    <div key={m.id} className="ri" style={{ borderTop: `8px solid ${def.color}` }}>
                        <div className="ri-title">
                            {def.icon} {def.title}
                        </div>
                        {def.fields.map(f => {
                            const val = m.data.vals[f.k];
                            const isCalc = m.data.calcKeys.includes(f.k);
                            if (val === null || val === undefined) return null;
                            return (
                                <div key={f.k} className="ri-row">
                                    <span>{f.l} {isCalc && '✨'}</span>
                                    <span className="ri-val" dir="ltr" lang="en" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                        {formatCurrency(val)} <span style={{ fontFamily: 'Cairo, sans-serif' }} dir="rtl" lang="ar">{f.u}</span>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                );
            })
        )}
      </div>
    </aside>
  );
};
