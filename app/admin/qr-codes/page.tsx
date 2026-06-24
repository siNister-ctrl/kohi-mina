"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Printer } from "lucide-react";
import Link from "next/link";

const TABLE_COUNT = 15;

export default function QRCodesPage() {
  const [qrCodes, setQrCodes] = useState<Record<number, { qrCode: string; url: string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateAll();
  }, []);

  async function generateAll() {
    const results: Record<number, any> = {};
    await Promise.all(
      Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map(async (tableNum) => {
        const res = await fetch(`/api/qr/${tableNum}`);
        if (res.ok) results[tableNum] = await res.json();
      })
    );
    setQrCodes(results);
    setLoading(false);
  }

  function downloadQR(tableNum: number) {
    const data = qrCodes[tableNum];
    if (!data) return;
    const a = document.createElement("a");
    a.href = data.qrCode;
    a.download = `kohimina-table-${tableNum}-qr.png`;
    a.click();
  }

  function printAll() {
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-coffee-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-coffee-600">Generating QR codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-coffee-700 text-white px-6 py-4 flex items-center gap-4 print:hidden">
        <Link href="/admin" className="p-2 hover:bg-coffee-600 rounded-xl"><ArrowLeft size={20} /></Link>
        <h1 className="font-bold text-xl flex-1">Table QR Codes</h1>
        <button onClick={printAll} className="flex items-center gap-2 bg-white text-coffee-700 px-4 py-2 rounded-xl font-semibold text-sm">
          <Printer size={16} /> Print All
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <p className="text-coffee-600 text-sm mb-6 print:hidden">
          Each QR code links directly to the menu for that table. Print and laminate them for placement on tables.
        </p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((tableNum) => {
            const data = qrCodes[tableNum];
            return (
              <div
                key={tableNum}
                className="bg-white rounded-2xl p-4 text-center shadow-sm flex flex-col items-center gap-2 border border-coffee-100"
              >
                <p className="font-bold text-coffee-700 text-sm">Table {tableNum}</p>
                {data?.qrCode ? (
                  <img src={data.qrCode} alt={`Table ${tableNum}`} className="w-full rounded-lg" />
                ) : (
                  <div className="w-full aspect-square bg-coffee-100 rounded-lg animate-pulse" />
                )}
                <p className="text-coffee-400 text-xs">Kohi Mina Cafe</p>
                <p className="text-coffee-300 text-xs">コーヒーみな</p>
                <button
                  onClick={() => downloadQR(tableNum)}
                  className="flex items-center gap-1 text-xs text-coffee-600 hover:text-coffee-800 transition-colors print:hidden"
                >
                  <Download size={12} /> Download
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
