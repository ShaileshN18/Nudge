import type { MentorContext, NudgeLevel } from "@/lib/ai/types";

/** Deterministic progression: repeat requests deepen guidance, while a new evaluation starts a fresh trail. */
export function chooseHintLevel(context: MentorContext): NudgeLevel {
  const lastHint = context.previousHints.at(-1);
  if (!lastHint) return 1;
  if (context.evaluation?.passed) return 1;
  const nextLvl = Math.min(lastHint.level + 1, 5) as NudgeLevel;
  return nextLvl;
}
