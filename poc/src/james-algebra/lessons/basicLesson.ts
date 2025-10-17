import { round, square } from "../factories";
import type { Lesson } from "../types";

const initialForms = [round()];
const goalForms = [round(square(round()))];

export const introductoryLesson: Lesson = {
  id: "lesson.intro.enfold",
  title: "Enfold the Unit",
  description:
    "Practice the inversion axiom by wrapping the unit form with a round container holding a square frame.",
  goalSummary: "Transform a single round unit into an enfolded round-square pair.",
  initialForms,
  goalForms,
  allowedRuleIds: ["axiom.enfold", "axiom.clarify"],
  hints: [
    "Select the lone round form to see where Enfold can apply.",
    "Enfold introduces a square boundary inside a round one.",
    "If you overshoot, use Clarify to reverse the step.",
  ],
};
