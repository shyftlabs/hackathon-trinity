import { NextResponse } from "next/server";
import { prisma } from "@backend/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/teacher/classes
 * Teacher fetches their classes
 */
export async function GET(request: Request) {
  try {
    // In a real app, extract teacher ID from JWT/session
    // For now, using a query param for testing
    const url = new URL(request.url);
    const teacherId = url.searchParams.get('teacherId');

    if (!teacherId) {
      return NextResponse.json(
        { error: "teacherId required" },
        { status: 400 }
      );
    }

    const classes = await prisma.class.findMany({
      where: { teacherId },
      include: {
        activeSession: {
          select: {
            id: true,
            title: true,
            pdfCount: true,
            audioCount: true,
            videoCount: true,
            imageCount: true,
            updatedAt: true,
          }
        },
        classSessions: {
          select: { sessionId: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({
      classes: classes.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        subject: c.subject,
        description: c.description,
        activeSession: c.activeSession,
        sessionCount: c.classSessions.length,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }))
    });

  } catch (error) {
    console.error("[Teacher Classes] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch classes" },
      { status: 500 }
    );
  }
}
