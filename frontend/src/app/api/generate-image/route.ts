import { NextRequest, NextResponse } from 'next/server';
import { generateContinuumText } from '@backend/ai';

export async function POST(request: NextRequest) {
  try {
    const { prompt, sceneType } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const enhancedPrompt = await generateContinuumText(
      "You write compact visual art direction briefs. Return only the brief, with no markdown.",
      `Create a cinematic fantasy quest scene brief from this description:\n\n${prompt}`
    ) || `Quest scene: ${prompt}`;

    return NextResponse.json({
      imageUrl: null,
      prompt: enhancedPrompt,
      sceneType
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
