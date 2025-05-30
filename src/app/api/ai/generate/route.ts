import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import prisma from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { getOrgOwnerFeatures } from "@/src/lib/features";
import { DEFAULT_FEATURES } from "@/src/constants/productFeatures";
import { addDays, isAfter, isSameDay } from "date-fns";

// Initialize the Google Generative AI client
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY || "" });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !session.organisation?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Enforce AI usage restrictions
  const features = await getOrgOwnerFeatures(session.organisation.id);
  if (features === DEFAULT_FEATURES) {
    // Check if trial expired
    const org = await prisma.organisation.findUnique({
      where: { id: session.organisation.id },
      select: { owner: { select: { createdAt: true } } },
    });
    if (org?.owner?.createdAt) {
      const trialEnd = addDays(org.owner.createdAt, 14);
      if (isAfter(new Date(), trialEnd)) {
        return NextResponse.json(
          {
            error:
              "Your 14-day trial has expired. Please upgrade to use AI features.",
          },
          { status: 403 }
        );
      }
    }
  }

  // Enforce aiTokens limit (per day)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { aiUsageToday: true, aiUsageDate: true },
  });
  let aiUsageToday = user?.aiUsageToday ?? 0;
  const aiUsageDate = user?.aiUsageDate;
  if (!aiUsageDate || !isSameDay(new Date(), aiUsageDate)) {
    aiUsageToday = 0;
  }
  if (aiUsageToday >= features.aiTokens) {
    return NextResponse.json(
      {
        error: "AI usage limit reached for today. Please upgrade your plan.",
      },
      { status: 403 }
    );
  }

  try {
    const { prompt, context } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Prepare the prompt with context if available
    let fullPrompt = `
    You are a professional LinkedIn content generator that creates engaging, well-formatted posts for the Lexical editor.
    
    GUIDELINES:
    1. Keep responses under 200 words and maintain a professional tone.
    2. Format your response to be directly usable in the Lexical editor.
    3. IMPORTANT FORMATTING INSTRUCTIONS:
       - DO NOT use markdown syntax like **bold** or *italic*
       - DO NOT use HTML tags
       - Use plain text with clear formatting instructions in comments
       - Use the following special characters directly in the text:
         • for bullet points
       - Use actual line breaks (new lines) to separate paragraphs
       - Use actual line breaks to create lists
    4. Structure your content with:
       - A compelling opening line
       - Clear, concise paragraphs
       - A strong call-to-action or conclusion
    5. Include relevant hashtags at the end (3-5 max)
    
    FORMATTING RULES:
    - Start each paragraph with a new line
    - Use bullet points (•) for lists
    - Use line breaks to separate sections
    - End with relevant hashtags
    
    EXAMPLE FORMAT:
    Here's an example of how to format your response:

    Exciting news! We're launching our new product today.

    Key features:
    • Feature 1
    • Feature 2
    • Feature 3

    Learn more at our website → [link]

    #ProductLaunch #Innovation #Tech
    
    You are a marketing expert with deep understanding of LinkedIn best practices, copywriting, and social media engagement.
    `;

    if (context) {
      fullPrompt += `\n\nHere is the current content for context:\n${context}\n\n`;
    }

    fullPrompt += `\nUser request: ${prompt}`;

    // Get the Gemini model
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: fullPrompt,
    });

    // Extract the text content from the response with proper type checking
    const generatedText =
      response?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!generatedText) {
      return NextResponse.json(
        { error: "No text was generated" },
        { status: 500 }
      );
    }

    if (aiUsageToday) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          aiUsageToday: aiUsageToday + 1,
          aiUsageDate: new Date(),
        },
      });
    } else {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          aiUsageToday: 1,
          aiUsageDate: new Date(),
        },
      });
    }

    return NextResponse.json({ text: generatedText });
  } catch (error) {
    console.error("Error generating text:", error);
    return NextResponse.json(
      { error: "Failed to generate text" },
      { status: 500 }
    );
  }
}
