import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize the Google Generative AI client
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY || "" });

export async function POST(request: Request) {
  try {
    const { prompt, context } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Prepare the prompt with context if available
    let fullPrompt = `You are a helpful assistant that generates concise, professional content for LinkedIn posts. Keep responses under 200 words and maintain a professional tone.`;

    if (context) {
      fullPrompt += `\n\nHere is the current content for context:\n${context}\n\n`;
    }

    fullPrompt += `\nUser request: ${prompt}`;

    // Get the Gemini model
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: fullPrompt,
    });

    return NextResponse.json({ text: response });
  } catch (error) {
    console.error("Error generating text:", error);
    return NextResponse.json(
      { error: "Failed to generate text" },
      { status: 500 }
    );
  }
}
