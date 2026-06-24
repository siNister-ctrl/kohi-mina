"use client";
import { useState } from "react";
import { ArrowLeft, FileText, Download } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function generateReport(type: "sales" | "inventory", period: string, format: "pdf" | "excel") {
    setLoading(`${type}-${format}`);
    try {
      const res = await fetch(`/api/analytics?period=${period}`);
      const data = await res.json();

      if (format === "excel") {
        const { utils, writeFile } = await import("xlsx");
        const wb = utils.book_new();

        if (type === "sales") {
          // Orders sheet
          const ordersData = (data.recentOrders || []).map((o: any) => ({
            "Order Number": o.orderNumber,
            "Table": `Table ${o.table?.number}`,
            "Status": o.status,
            "Payment Method": o.paymentMethod,
            "Payment Status": o.paymentStatus,
            "Total (₱)": o.total,
            "Date": new Date(o.createdAt).toLocaleString(),
          }));
          const ws = utils.json_to_sheet(ordersData);
          utils.book_append_sheet(wb, ws, "Sales Report");

          // Summary sheet
          const summaryData = [
            { "Metric": "Total Orders", "Value": data.totalOrders },
            { "Metric": "Completed Orders", "Value": data.completedOrders },
            { "Metric": "Total Revenue", "Value": `₱${data.totalRevenue?.toFixed(2)}` },
            { "Metric": "Average Order Value", "Value": `₱${data.averageOrderValue?.toFixed(2)}` },
          ];
          const ws2 = utils.json_to_sheet(summaryData);
          utils.book_append_sheet(wb, ws2, "Summary");
        } else {
          // Inventory
          const ingRes = await fetch("/api/ingredients");
          const ings = await ingRes.json();
          const ingData = ings.map((i: any) => ({
            "Ingredient": i.name,
            "Unit": i.unit,
            "Current Stock": i.currentStock,
            "Low Stock Alert": i.lowStockAlert,
            "Critical Alert": i.criticalAlert,
            "Status": i.alertLevel,
          }));
          const ws = utils.json_to_sheet(ingData);
          utils.book_append_sheet(wb, ws, "Inventory Report");
        }

        writeFile(wb, `kohimina-${type}-report-${period}.xlsx`);
        toast.success("Excel report downloaded!");
      } else {
        // PDF using jspdf
        const { default: jsPDF } = await import("jspdf");
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.setTextColor(74, 44, 23);
        doc.text("Kohi Mina Cafe", 20, 20);
        doc.setFontSize(14);
        doc.text(`${type === "sales" ? "Sales" : "Inventory"} Report — ${period.toUpperCase()}`, 20, 32);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 42);

        let y = 55;
        doc.setFontSize(12);
        doc.setTextColor(0);

        if (type === "sales") {
          doc.text(`Total Orders: ${data.totalOrders}`, 20, y); y += 10;
          doc.text(`Completed: ${data.completedOrders}`, 20, y); y += 10;
          doc.text(`Revenue: ₱${(data.totalRevenue || 0).toFixed(2)}`, 20, y); y += 10;
          doc.text(`Avg Order Value: ₱${(data.averageOrderValue || 0).toFixed(2)}`, 20, y); y += 20;

          doc.setFontSize(11);
          doc.text("Recent Orders:", 20, y); y += 8;
          doc.setFontSize(9);
          for (const o of (data.recentOrders || []).slice(0, 20)) {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(`${o.orderNumber} | Table ${o.table?.number} | ${o.status} | ₱${o.total} | ${new Date(o.createdAt).toLocaleDateString()}`, 20, y);
            y += 7;
          }
        } else {
          const ingRes = await fetch("/api/ingredients");
          const ings = await ingRes.json();
          doc.text("Ingredient Inventory:", 20, y); y += 10;
          doc.setFontSize(9);
          for (const i of ings) {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(`${i.name} — ${i.currentStock} ${i.unit} [${i.alertLevel}]`, 20, y);
            y += 7;
          }
        }

        doc.save(`kohimina-${type}-report-${period}.pdf`);
        toast.success("PDF report downloaded!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate report");
    } finally {
      setLoading(null);
    }
  }

  const reportOptions = [
    { id: "sales-daily-excel", type: "sales" as const, period: "daily", format: "excel" as const, label: "Daily Sales", icon: "📊", desc: "Today's orders & revenue as Excel" },
    { id: "sales-monthly-excel", type: "sales" as const, period: "monthly", format: "excel" as const, label: "Monthly Sales", icon: "📈", desc: "This month's sales report as Excel" },
    { id: "sales-daily-pdf", type: "sales" as const, period: "daily", format: "pdf" as const, label: "Daily Report PDF", icon: "📄", desc: "Today's summary as PDF" },
    { id: "sales-monthly-pdf", type: "sales" as const, period: "monthly", format: "pdf" as const, label: "Monthly Report PDF", icon: "📋", desc: "Monthly summary as PDF" },
    { id: "inventory-pdf", type: "inventory" as const, period: "monthly", format: "pdf" as const, label: "Inventory PDF", icon: "🗂️", desc: "Current stock levels as PDF" },
    { id: "inventory-excel", type: "inventory" as const, period: "monthly", format: "excel" as const, label: "Inventory Excel", icon: "📦", desc: "Ingredient stock report as Excel" },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-coffee-700 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="p-2 hover:bg-coffee-600 rounded-xl"><ArrowLeft size={20} /></Link>
        <h1 className="font-bold text-xl">Reports</h1>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6">
        <p className="text-coffee-600 text-sm mb-6">Download reports in Excel or PDF format for your records.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportOptions.map((opt) => (
            <div key={opt.id} className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <span className="text-3xl">{opt.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-coffee-800">{opt.label}</p>
                <p className="text-coffee-500 text-xs">{opt.desc}</p>
              </div>
              <button
                onClick={() => generateReport(opt.type, opt.period, opt.format)}
                disabled={loading !== null}
                className="flex items-center gap-1 px-3 py-2 bg-coffee-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {loading === `${opt.type}-${opt.format}` ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                {opt.format.toUpperCase()}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
