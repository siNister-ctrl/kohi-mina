import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await params;
    const body = await req.json();
    const id = parseInt(rawId);

    if (body.restock) {
      const updated = await prisma.ingredient.update({
        where: { id },
        data: { currentStock: { increment: parseFloat(body.amount) } },
      });
      await prisma.inventoryTransaction.create({
        data: {
          ingredientId: id,
          type: "RESTOCK",
          quantity: parseFloat(body.amount),
          note: body.note || "Manual restock",
        },
      });
      let alertLevel: "NORMAL" | "LOW" | "CRITICAL" = "NORMAL";
      if (updated.currentStock <= updated.criticalAlert) alertLevel = "CRITICAL";
      else if (updated.currentStock <= updated.lowStockAlert) alertLevel = "LOW";
      await prisma.ingredient.update({ where: { id }, data: { alertLevel } });
      return NextResponse.json(updated);
    }

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        name: body.name,
        unit: body.unit,
        currentStock: body.currentStock !== undefined ? parseFloat(body.currentStock) : undefined,
        lowStockAlert: body.lowStockAlert !== undefined ? parseFloat(body.lowStockAlert) : undefined,
        criticalAlert: body.criticalAlert !== undefined ? parseFloat(body.criticalAlert) : undefined,
      },
    });
    return NextResponse.json(ingredient);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.ingredient.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
