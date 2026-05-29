import { NextResponse } from "next/server";
import { prisma } from "@backend/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/class/[code]
 * Student fetches class info and active session content
 * Automatically syncs latest files uploaded by teacher
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const resolvedParams = await params;
    const classCode = resolvedParams.code.toUpperCase();

    // Find the class with active session
    const classRecord = await prisma.class.findUnique({
      where: { code: classCode },
      include: {
        activeSession: {
          select: {
            id: true,
            title: true,
            date: true,
            pdfCount: true,
            audioCount: true,
            videoCount: true,
            imageCount: true,
            files: true,
            notes: true,
            flashcards: true,
            quiz: true,
            podcast: true,
            visual: true,
            quest: true,
            activeModes: true,
            notesProgress: true,
            flashcardsProgress: true,
            quizProgress: true,
            questProgress: true,
            podcastProgress: true,
            visualProgress: true,
            audioProgress: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });

    if (!classRecord) {
      return NextResponse.json(
        { error: `Class ${classCode} not found` },
        { status: 404 }
      );
    }

    if (!classRecord.activeSession) {
      return NextResponse.json(
        { error: "Class has no active session. Teacher needs to upload materials." },
        { status: 404 }
      );
    }

    // Format session data for frontend (strip internal markers)
    const session = classRecord.activeSession;
    let notesContent = session.notes || '';
    
    // Remove extraction markers for display
    notesContent = notesContent
      .replace(/\[EXTRACTION_ONLY\][\s\S]*?\[END_EXTRACTION_ONLY\]\n\n/g, '')
      .replace(/\[EXTRACTION_ONLY\][\s\S]*?\[END_EXTRACTION_ONLY\]/g, '')
      .trim();

    // Parse JSON fields
    const parseJsonField = <T>(value: string | null): T | null => {
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    };

    const response = {
      code: classCode,
      name: classRecord.name,
      subject: classRecord.subject || undefined,
      description: classRecord.description || undefined,
      session: {
        id: session.id,
        title: session.title,
        date: session.date,
        materials: {
          pdfs: session.pdfCount || 0,
          audio: session.audioCount || 0,
          video: session.videoCount || 0,
          images: session.imageCount || 0,
        },
        files: session.files ? JSON.parse(session.files) : [],
        activeModes: session.activeModes?.split(',').filter(Boolean) || [],
        
        // Generated content
        notes: notesContent || null,
        flashcards: parseJsonField(session.flashcards),
        quiz: parseJsonField(session.quiz),
        podcast: parseJsonField(session.podcast),
        visual: parseJsonField(session.visual),
        quest: parseJsonField(session.quest),
        
        // Progress tracking
        progress: {
          notes: session.notesProgress || 0,
          flashcards: session.flashcardsProgress || 0,
          quiz: session.quizProgress || 0,
          podcast: session.podcastProgress || 0,
          visual: session.visualProgress || 0,
          quest: session.questProgress || 0,
          audio: session.audioProgress || 0,
        },
        
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }
    };

    console.log(`[Class Fetch] ✓ Student retrieved class ${classCode}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error("[Class Fetch] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch class" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/class/[code]
 * Update class metadata
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const resolvedParams = await params;
    const classCode = resolvedParams.code.toUpperCase();
    const body = await request.json();

    const updated = await prisma.class.update({
      where: { code: classCode },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.subject && { subject: body.subject }),
        ...(body.description !== undefined && { description: body.description }),
      }
    });

    return NextResponse.json({
      success: true,
      class: updated
    });

  } catch (error) {
    console.error("[Class Update] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update class" },
      { status: 500 }
    );
  }
}
