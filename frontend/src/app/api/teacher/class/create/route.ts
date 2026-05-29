import { NextResponse } from "next/server";
import { prisma } from "@backend/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/teacher/class/create
 * Teacher creates a new class
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teacherId, name, subject, description, code } = body;

    if (!teacherId || !name || !code) {
      return NextResponse.json(
        { error: "teacherId, name, and code required" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await prisma.class.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existing) {
      return NextResponse.json(
        { error: `Class code ${code} already exists` },
        { status: 409 }
      );
    }

    // Verify teacher exists
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId }
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 }
      );
    }

    const newClass = await prisma.class.create({
      data: {
        code: code.toUpperCase(),
        name,
        subject: subject || null,
        description: description || null,
        teacherId,
      }
    });

    console.log(`[Teacher Class] Created class ${newClass.code}`);

    return NextResponse.json({
      success: true,
      class: {
        id: newClass.id,
        code: newClass.code,
        name: newClass.name,
        subject: newClass.subject,
        description: newClass.description,
      }
    });

  } catch (error) {
    console.error("[Teacher Class Create] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create class" },
      { status: 500 }
    );
  }
}
