import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const exportToExcel = (transactions) => {
  const worksheet = XLSX.utils.json_to_sheet(transactions.map(t => ({
    Date: t.date ? format(new Date(t.date), 'yyyy-MM-dd') : 'N/A',
    Type: t.type,
    Category: t.category,
    Amount: t.amount,
    Note: t.note || ''
  })));
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
  XLSX.writeFile(workbook, `Transactions_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

export const exportToPDF = (transactions) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text("ExpenseAI Transaction Report", 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 30);
  
  const tableColumn = ["Date", "Type", "Category", "Amount", "Note"];
  const tableRows = transactions.map(t => [
    t.date ? format(new Date(t.date), 'yyyy-MM-dd') : 'N/A',
    t.type,
    t.category,
    parseFloat(t.amount).toFixed(2),
    t.note || ''
  ]);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    foot: [
      ['', '', 'TOTAL INCOME:', totalIncome.toFixed(2), ''],
      ['', '', 'TOTAL EXPENSES:', totalExpense.toFixed(2), ''],
      ['', '', 'NET BALANCE:', (totalIncome - totalExpense).toFixed(2), '']
    ],
    startY: 40,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [99, 102, 241] },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' }
  });

  doc.save(`Transactions_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
