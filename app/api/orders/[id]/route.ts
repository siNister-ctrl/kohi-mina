import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        table: true,
        items: { include: { product: true } },
        payment: true,
      },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const body = await req.json();
    const { status, paymentStatus } = body;
    const orderId = parseInt(rawId);

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { table: true, items: { include: { product: true } }, payment: true },
    });

    if (status === "COMPLETED") {
      for (const item of order.items) {
        const productIngredients = await prisma.productIngredient.findMany({
          where: { productId: item.productId },
          include: { ingredient: true },
        });
        for (const pi of productIngredients) {
          const deductAmount = pi.quantity * item.quantity;
          const updated = await prisma.ingredient.update({
            where: { id: pi.ingredientId },
            data: { currentStock: { decrement: deductAmount } },
          });
          let alertLevel: "NORMAL" | "LOW" | "CRITICAL" = "NORMAL";
          if (updated.currentStock <= updated.criticalAlert) alertLevel = "CRITICAL";
          else if (updated.currentStock <= updated.lowStockAlert) alertLevel = "LOW";
          await prisma.ingredient.update({
            where: { id: pi.ingredientId },
            data: { alertLevel },
          });
          await prisma.inventoryTransaction.create({
            data: {
              ingredientId: pi.ingredientId,
              type: "DEDUCT",
              quantity: deductAmount,
              note: `Order ${order.orderNumber}`,
            },
          });
        }
      }
    }

    if (paymentStatus && order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          status: paymentStatus,
          paidAt: paymentStatus === "PAID" ? new Date() : undefined,
        },
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
