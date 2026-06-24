import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const orders = await prisma.order.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        table: true,
        items: { include: { product: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tableId, items, paymentMethod, notes } = body;

    const table = await prisma.table.findUnique({ where: { number: parseInt(tableId) } });
    if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 });

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        size: item.size || null,
        sugarLevel: item.sugarLevel || null,
        addOns: item.addOns ? JSON.stringify(item.addOns) : null,
        notes: item.notes || null,
      });
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        tableId: table.id,
        paymentMethod: paymentMethod || "CASH",
        subtotal,
        total: subtotal,
        notes,
        items: { create: orderItems },
        payment: {
          create: {
            method: paymentMethod || "CASH",
            amount: subtotal,
            status: "UNPAID",
          },
        },
      },
      include: {
        table: true,
        items: { include: { product: true } },
        payment: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
