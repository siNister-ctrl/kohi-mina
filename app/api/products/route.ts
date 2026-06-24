import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, price, categoryId, imageUrl, ingredients } = body;
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        categoryId: parseInt(categoryId),
        imageUrl,
        ingredients: ingredients
          ? {
              create: ingredients.map((ing: any) => ({
                ingredientId: ing.ingredientId,
                quantity: ing.quantity,
              })),
            }
          : undefined,
      },
      include: { category: true, ingredients: { include: { ingredient: true } } },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
