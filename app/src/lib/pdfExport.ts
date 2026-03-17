import { MODULES } from '@/core/modules';
import { AccountNode } from '@/store/accountStore';
import { formatCurrency } from '@/lib/utils';

/**
 * Generates a professional step-by-step PDF solution
 * using the browser's print-to-PDF functionality with a clean styled document.
 */
export const generatePDF = (nodes: AccountNode[]) => {
  const activeNodes = nodes.filter(n =>
    Object.values(n.data.vals).some(v => v !== null && v !== undefined)
  );

  if (activeNodes.length === 0) {
    alert('لا توجد بيانات لحفظها');
    return;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('ar-EG', {
    hour: '2-digit', minute: '2-digit'
  });

  let stepsHtml = '';

  activeNodes.forEach((node, idx) => {
    const def = MODULES.find(d => d.id === node.data.defId);
    if (!def) return;

    const givenFields = def.fields.filter(f => {
      const v = node.data.vals[f.k];
      return v !== null && v !== undefined && node.data.manualKeys?.includes(f.k);
    });

    const calcFields = def.fields.filter(f => {
      const v = node.data.vals[f.k];
      return v !== null && v !== undefined && node.data.calcKeys?.includes(f.k);
    });

    const inheritedFields = def.fields.filter(f => {
      const v = node.data.vals[f.k];
      return v !== null && v !== undefined &&
        !node.data.manualKeys?.includes(f.k) &&
        !node.data.calcKeys?.includes(f.k) &&
        node.data.inheritedKeys?.includes(f.k);
    });

    stepsHtml += `
      <div class="step-card">
        <div class="step-header" style="border-color: ${def.color}; background: ${def.color}22;">
          <span class="step-num">${idx + 1}</span>
          <span class="step-title">${def.icon} ${def.title}</span>
        </div>

        <div class="step-body">
          ${def.formula ? `<div class="formula-box">📐 القانون: ${def.formula}</div>` : ''}

          ${givenFields.length > 0 ? `
            <div class="section-label">المعطيات:</div>
            <table class="data-table">
              ${givenFields.map(f => `
                <tr>
                  <td class="label-cell">${f.l}</td>
                  <td class="value-cell">${formatCurrency(node.data.vals[f.k]!)} ${f.u}</td>
                </tr>
              `).join('')}
            </table>
          ` : ''}

          ${inheritedFields.length > 0 ? `
            <div class="section-label">قيم مستلمة من كروت أخرى:</div>
            <table class="data-table inherited">
              ${inheritedFields.map(f => `
                <tr>
                  <td class="label-cell">${f.l}</td>
                  <td class="value-cell">${formatCurrency(node.data.vals[f.k]!)} ${f.u}</td>
                </tr>
              `).join('')}
            </table>
          ` : ''}

          ${calcFields.length > 0 ? `
            <div class="section-label result-label">الحل (النتائج المحسوبة):</div>
            <table class="data-table results">
              ${calcFields.map(f => `
                <tr>
                  <td class="label-cell">${f.l}</td>
                  <td class="value-cell result-val">${formatCurrency(node.data.vals[f.k]!)} ${f.u}</td>
                </tr>
              `).join('')}
            </table>
          ` : ''}

          ${(node.data.vals as Record<string, unknown>)._error ? `
            <div class="error-note">⚠️ ${(node.data.vals as Record<string, unknown>)._error}</div>
          ` : ''}
        </div>
      </div>
    `;
  });

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>حل المسألة — AccountSketch</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Outfit:wght@500;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Cairo', sans-serif;
      background: #fff;
      color: #1a1a2e;
      padding: 40px 50px;
      line-height: 1.8;
    }

    .pdf-header {
      text-align: center;
      margin-bottom: 36px;
      padding-bottom: 20px;
      border-bottom: 3px solid #000;
    }

    .pdf-header h1 {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.5px;
    }

    .pdf-header .subtitle {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }

    .pdf-header .date {
      font-size: 13px;
      color: #999;
      margin-top: 8px;
      font-family: 'Outfit', sans-serif;
    }

    .step-card {
      border: 2px solid #222;
      border-radius: 8px;
      margin-bottom: 24px;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .step-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      border-bottom: 2px solid #222;
      font-weight: 800;
      font-size: 18px;
    }

    .step-num {
      background: #222;
      color: #fff;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Outfit', sans-serif;
      font-size: 15px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .step-body {
      padding: 16px 20px;
    }

    .formula-box {
      background: #f0f4ff;
      border: 1px solid #c7d2fe;
      border-radius: 6px;
      padding: 10px 16px;
      margin-bottom: 16px;
      font-size: 14px;
      color: #4338ca;
      font-weight: 600;
    }

    .section-label {
      font-weight: 800;
      font-size: 15px;
      margin: 14px 0 8px;
      color: #333;
    }

    .result-label { color: #059669; }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }

    .data-table td {
      padding: 8px 14px;
      border: 1px solid #e5e7eb;
      font-size: 14px;
    }

    .label-cell {
      background: #fafafa;
      font-weight: 600;
      width: 55%;
    }

    .value-cell {
      font-family: 'Outfit', 'Cairo', sans-serif;
      font-weight: 700;
      text-align: left;
      direction: ltr;
    }

    .results .label-cell { background: #ecfdf5; }
    .results .value-cell { background: #f0fdf4; }
    .result-val { color: #059669; font-weight: 800; }

    .inherited .label-cell { background: #eef2ff; }
    .inherited .value-cell { background: #f5f3ff; color: #6366f1; }

    .error-note {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 6px;
      padding: 8px 14px;
      margin-top: 12px;
      color: #dc2626;
      font-weight: 600;
      font-size: 13px;
    }

    .pdf-footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 16px;
      border-top: 2px solid #e5e7eb;
      color: #aaa;
      font-size: 12px;
    }

    @media print {
      body { padding: 20px 30px; }
      .step-card { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="pdf-header">
    <h1>📐 حل المسألة — AccountSketch Pro</h1>
    <div class="subtitle">إجابة نموذجية مفصلة بالخطوات</div>
    <div class="date">${dateStr} — ${timeStr}</div>
  </div>

  ${stepsHtml}

  <div class="pdf-footer">
    تم الإنشاء بواسطة AccountSketch Pro — نظام الحسابات الذكي
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بفتح النوافذ المنبثقة');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for fonts to load then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 600);
  };
};
