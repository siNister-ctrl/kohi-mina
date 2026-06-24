import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("paymongo-signature") || "";
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET || "";

    // Verify signature
    const [tPart, v1Part] = signature.split(",");
    const t = tPart?.replace("t=", "");
    const v1 = v1Part?.replace("v1=", "");
    const toSign = `${t}.${body}`;
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(toSign)
      .digest("hex");

    if (expected !== v1) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventType = event.data?.attributes?.type;
    const paymentData = event.data?.attributes?.data;

    if (eventType === "payment.paid" || eventType === "link.payment.paid") {
      const remarks = paymentData?.attributes?.remarks || paymentData?.attributes?.description;
      if (remarks) {
        const payment = await prisma.payment.findFirst({
          where: { OR: [{ paymongoId: paymentData?.id }, { order: { orderNumber: remarks } }] },
          include: { order: true },
        });
        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: "PAID", paidAt: new Date() },
          });
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: "PAID" },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
