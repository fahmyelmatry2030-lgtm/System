import * as XLSX from 'xlsx';

export const exportToExcel = (data, fileName) => {
  if (!data || data.length === 0) {
    alert('لا توجد بيانات للتصدير');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات');
  
  // Set RTL
  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ rightToLeft: true });

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
