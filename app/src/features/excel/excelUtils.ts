import { AccountNode } from '@/store/accountStore';
import { MODULES } from '@/core/modules';
import ExcelJS from 'exceljs';

export const exportToExcelCSV = async (nodes: AccountNode[]) => {
  const activeNodes = nodes.filter(n =>
    Object.values(n.data.vals).some(v => v !== null && v !== undefined)
  );

  if (activeNodes.length === 0) {
    alert('لا يوجد بيانات لتصديرها');
    return;
  }

  // إنشاء ملف Excel جديد
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('النتائج المباشرة', {
    views: [{ rightToLeft: true }] // ضبط اتجاه الشيت ليكون من اليمين لليسار
  });

  // تحديد أعمدة الجدول (3 أعمدة فقط بناءً على طلبك)
  worksheet.columns = [
    { key: 'label', width: 35 },
    { key: 'value', width: 25 },
    { key: 'unit', width: 15 }
  ];

  // تعبئة البيانات على شكل كروت متتالية
  activeNodes.forEach((m, index) => {
    const def = MODULES.find(d => d.id === m.data.defId);
    if (!def) return;
    
    // إضافة مسافة فاصلة بين الكروت إذا لم يكن هذا هو الكرت الأول
    if (index > 0) {
      worksheet.addRow([]);
    }

    // 1. صف عنوان الكرت المتضمن اسم الوحدة
    const headerRow = worksheet.addRow({
      label: def.title,
      value: 'القيمة',
      unit: 'وحدة القياس'
    });
    
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Cairo Black', size: 12, color: { argb: 'FFFFFFFF' }, bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF192231' } // لون داكن يطابق الصورة المرفقة
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } }, left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } }, right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // 2. صفوف البيانات التابعة للكرت
    def.fields.forEach(f => {
      const val = m.data.vals[f.k];
      if (val !== null && val !== undefined) {
        const row = worksheet.addRow({
          label: f.l,
          value: Number(val), // كرقم ليتم تنسيقه بشكل صحيح كأرقام إنجليزية
          unit: f.u
        });
        
        row.font = { name: 'Cairo', size: 11 };
        row.alignment = { vertical: 'middle', horizontal: 'center' };
        
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
        });

        // تنسيق الأرقام
        row.getCell('value').numFmt = '#,##0.00';
      }
    });
  });

  // تصدير الملف وتنزيله
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'نتائج_التحليل_accountsketch.xlsx';
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
