import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export const exportToExcel = (transactions) => {
  const worksheet = XLSX.utils.json_to_sheet(
    transactions.map((t) => ({
      তারিখ: t.date ? format(new Date(t.date), "yyyy-MM-dd") : "অনুপলব্ধ",
      প্রকার: t.type,
      বিভাগ: t.category,
      পরিমাণ: t.amount,
      নোট: t.note || "",
    })),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "লেনদেন");
  XLSX.writeFile(workbook, `লেনদেন_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};

export const exportToPDF = (transactions) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("আমার হিসাব নিকাশ - লেনদেন রিপোর্ট", 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`তৈরি করা হয়েছে: ${format(new Date(), "PPP")}`, 14, 30);

  const tableColumn = ["তারিখ", "প্রকার", "বিভাগ", "পরিমাণ", "নোট"];
  const tableRows = transactions.map((t) => [
    t.date ? format(new Date(t.date), "yyyy-MM-dd") : "অনুপলব্ধ",
    t.type,
    t.category,
    parseFloat(t.amount).toFixed(2),
    t.note || "",
  ]);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    foot: [
      ["", "", "মোট আয়:", totalIncome.toFixed(2), ""],
      ["", "", "মোট খরচ:", totalExpense.toFixed(2), ""],
      ["", "", "নেট ব্যালান্স:", (totalIncome - totalExpense).toFixed(2), ""],
    ],
    startY: 40,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [99, 102, 241] },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: "bold",
    },
  });

  doc.save(`লেনদেন_${format(new Date(), "yyyy-MM-dd")}.pdf`);
};
