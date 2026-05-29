import { NextResponse } from "next/server";
import { prisma } from "@backend/prisma";
import { generateSessionTitleAI } from "@backend/ai";
import { parseFile } from "@backend/fileParser";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/class/[code]/upload
 * Teacher uploads files to update class session
 * This replaces or updates the active session for the class
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const resolvedParams = await params;
    const classCode = resolvedParams.code.toUpperCase();

    // Find the class
    const classRecord = await prisma.class.findUnique({
      where: { code: classCode },
      include: { activeSession: true }
    });

    if (!classRecord) {
      return NextResponse.json(
        { error: `Class ${classCode} not found` },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const title = formData.get('title') as string | null;
    const modes = formData.get('activeModes') as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    console.log(`[Teacher Upload] Class ${classCode}: ${files.length} files`);

    // Extract content from files
    let extractedContent = '';
    const fileCounts = {
      pdfs: 0,
      audio: 0,
      video: 0,
      image: 0,
    };

    for (const file of files) {
      try {
        console.log(`[File Parser] Parsing (teacher): ${file.name}`);
        const parsed = await parseFile(file);
        extractedContent += `\n\n--- ${file.name} (${parsed.type.toUpperCase()}) ---\n${parsed.content}`;
        
        // Count file types
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) fileCounts.pdfs++;
        if (file.type.startsWith('audio/')) fileCounts.audio++;
        if (file.type.startsWith('video/')) fileCounts.video++;
        if (file.type.startsWith('image/')) fileCounts.image++;
      } catch (error) {
        console.error(`[File Parser] Error: ${error}`);
        extractedContent += `\n\n--- ${file.name} (ERROR) ---\n[Failed to parse]`;
      }
    }

    // Generate session title
    let sessionTitle = title;
    if (!sessionTitle && extractedContent.length > 50) {
      sessionTitle = await generateSessionTitleAI(extractedContent);
    }
    sessionTitle = sessionTitle || `${classRecord.name} - ${new Date().toLocaleDateString()}`;

    // Create or update the active session
    const modesStr = modes || `["notes","flashcards"]`;
    const notesContent = `[EXTRACTION_ONLY]\n${extractedContent}\n[END_EXTRACTION_ONLY]`;

    let session;
    if (classRecord.activeSessionId) {
      // Update existing session
      console.log(`[Teacher Upload] Updating existing session ${classRecord.activeSessionId}`);
      session = await prisma.session.update({
        where: { id: classRecord.activeSessionId },
        data: {
          title: sessionTitle,
          notes: notesContent,
          pdfCount: fileCounts.pdfs,
          audioCount: fileCounts.audio,
          videoCount: fileCounts.video,
          imageCount: fileCounts.image,
          activeModes: modesStr,
          files: JSON.stringify(files.map(f => ({ name: f.name, type: f.type }))),
          // Reset generated content so students get fresh generation
          flashcards: null,
          quiz: null,
          podcast: null,
          visual: null,
          quest: null,
          // Reset progress
          notesProgress: 0,
          flashcardsProgress: 0,
          quizProgress: 0,
          podcastProgress: 0,
          visualProgress: 0,
          questProgress: 0,
          audioProgress: 0,
        }
      });
    } else {
      // Create new session for this class
      console.log(`[Teacher Upload] Creating new session for class`);
      session = await prisma.session.create({
        data: {
          title: sessionTitle,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          lastStudied: "Just now",
          notes: notesContent,
          pdfCount: fileCounts.pdfs,
          audioCount: fileCounts.audio,
          videoCount: fileCounts.video,
          imageCount: fileCounts.image,
          activeModes: modesStr,
          files: JSON.stringify(files.map(f => ({ name: f.name, type: f.type }))),
        }
      });

      // Set it as the active session for the class
      await prisma.class.update({
        where: { code: classCode },
        data: { activeSessionId: session.id }
      });
    }

    // Add to class history if not already there
    await prisma.classSession.upsert({
      where: {
        classId_sessionId: {
          classId: classRecord.id,
          sessionId: session.id,
        }
      },
      create: {
        classId: classRecord.id,
        sessionId: session.id,
      },
      update: {}
    });

    console.log(`[Teacher Upload] ✓ Session updated for class ${classCode}`);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      classCode: classCode,
      title: session.title,
      filesCount: files.length,
      message: `Files uploaded to ${classRecord.name}. ${files.length} file(s) ready for students.`
    });

  } catch (error) {
    console.error("[Teacher Upload] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload files" },
      { status: 500 }
    );
  }
}
