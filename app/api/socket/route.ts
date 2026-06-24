// Socket.io on Vercel serverless doesn't support persistent connections.
// Real-time is handled via polling (5s intervals) in cashier/barista pages.
// This route exists as a placeholder for local dev with a custom server.

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Socket.io not available in serverless mode. Polling is used instead.",
    polling: true,
  });
}
