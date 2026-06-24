import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: Request, { params }: { params: Promise<{ tableId: string }> }) {
  try {
    const { tableId } = await params;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${appUrl}/menu?table=${tableId}`;

    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: "#4a2c17", light: "#faf5ee" },
    });

    return NextResponse.json({ qrCode: qrDataUrl, url, tableId });
  } catch {
    return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
  }
}
