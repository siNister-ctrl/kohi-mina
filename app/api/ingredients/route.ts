import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(ingredients);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ingredient = await prisma.ingredient.create({
      data: {
        name: body.name,
        unit: body.unit,
        currentStock: parseFloat(body.currentStock || 0),
        lowStockAlert: parseFloat(body.lowStockAlert || 10),
        criticalAlert: parseFloat(body.criticalAlert || 5),
      },
    });
    return NextResponse.json(ingredient, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
