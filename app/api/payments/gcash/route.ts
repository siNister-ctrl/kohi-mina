import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { payment: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET_KEY!;
    const encoded = Buffer.from(`${PAYMONGO_SECRET}:`).toString("base64");

    // Create payment link via Paymongo
    const response = await fetch("https://api.paymongo.com/v1/links", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(order.total * 100), // in centavos
            description: `Kohi Mina Cafe — ${order.orderNumber}`,
            remarks: order.orderNumber,
          },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Paymongo error:", data);
      return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
    }

    const checkoutUrl = data.data.attributes.checkout_url;
    const paymongoId = data.data.id;

    // Update payment record
    await prisma.payment.update({
      where: { orderId: order.id },
      data: {
        paymongoId,
        paymongoUrl: checkoutUrl,
        status: "PENDING",
        method: "GCASH",
      },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentMethod: "GCASH", paymentStatus: "PENDING" },
    });

    return NextResponse.json({ checkoutUrl, paymongoId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
