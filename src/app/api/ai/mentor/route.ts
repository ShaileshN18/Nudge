import { NextResponse } from "next/server";
import { buildMentorContext } from "@/lib/ai/context/buildContext";
import { runMentor } from "@/lib/ai/mentor/mentorEngine";
import type { MentorInteractionType } from "@/lib/ai/types";

export const dynamic = "force-dynamic";
const interactionTypes = new Set<MentorInteractionType>(["nudge", "chat", "debug", "explain"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!interactionTypes.has(body.type) || !body.task) return NextResponse.json({ error: "A valid mentor type and task are required." }, { status: 400 });
    if ((body.type === "chat" || body.type === "debug" || body.type === "explain") && !body.message?.trim()) return NextResponse.json({ error: "A message is required for this mentor interaction." }, { status: 400 });
    const context = buildMentorContext({ task: body.task, files: body.files || [], activeFilePath: body.activeFilePath, evaluation: body.evaluation, previousHints: body.previousHints, conversation: body.conversation });
    const mentor = await runMentor(body.type, context, body.message);
    return NextResponse.json({ success: true, mentor });
  } catch (error: any) {
    console.error("Mentor request failed:", error);
    return NextResponse.json({ error: error?.message || "Unable to generate mentor guidance." }, { status: 500 });
  }
}
