import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {
      name: body.name,
      role: body.role,
      isActive: body.isActive,
    };
    if (body.password) data.password = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.user.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
