import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { number: "asc" },
      include: {
        orders: {
          where: {
            status: {
              in: ["PENDING", "CONFIRMED", "PREPARING", "READY"],
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return NextResponse.json({ tables });
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { error: "Failed to fetch tables" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { number, capacity } = await request.json();

    if (!number) {
      return NextResponse.json(
        { error: "Table number is required" },
        { status: 400 }
      );
    }

    // Check if table already exists
    const existing = await prisma.table.findUnique({
      where: { number: parseInt(number) },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Table ${number} already exists` },
        { status: 409 }
      );
    }

    const tableNum = parseInt(number);
    const table = await prisma.table.create({
      data: {
        number: tableNum,
        name: `Table ${tableNum}`,
        capacity: capacity ? parseInt(capacity) : 4,
        qrCode: `table-${number}`,
        isActive: true,
      },
    });

    return NextResponse.json({ table }, { status: 201 });
  } catch (error) {
    console.error("Error creating table:", error);
    return NextResponse.json(
      { error: "Failed to create table" },
      { status: 500 }
    );
  }
}
