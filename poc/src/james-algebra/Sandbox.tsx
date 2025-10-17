import { useMemo, useState } from "react";
import { applyRule, enumerateMatches, isGoalReached } from "./engine";
import { introductoryLesson } from "./lessons";
import { cloneForest } from "./structure";
import { RULES } from "./rules";
import type { Form, FormForest, FormPath, Rule, RuleMatch } from "./types";

interface HistoryEntry {
  forms: FormForest;
  appliedRuleId?: string;
  matchPath?: FormPath;
  matchPathLabel?: string;
}

const boundarySymbols: Record<Form["boundary"], [open: string, close: string]> = {
  round: ["(", ")"],
  square: ["[", "]"],
  angle: ["<", ">"],
};

function formToString(form: Form): string {
  const [open, close] = boundarySymbols[form.boundary];
  if (form.children.length === 0) {
    return `${open}${close}`;
  }
  return `${open}${form.children.map(child => formToString(child)).join(" ")}${close}`;
}

function formatForest(forms: FormForest): string {
  if (forms.length === 0) return "∅";
  return forms.map(formToString).join(" ");
}

function describePath(forms: FormForest, path: FormPath): string {
  if (path.length === 0) return "root";

  const segments: string[] = [];
  let currentLevel: FormForest = forms;

  path.forEach((index, depth) => {
    const node = currentLevel[index];
    const labelPrefix = `L${depth}[${index}]`;
    if (!node) {
      segments.push(`${labelPrefix} • ?`);
      currentLevel = [];
      return;
    }

    segments.push(`${labelPrefix} • ${node.boundary}`);
    currentLevel = node.children;
  });

  return segments.join(" › ");
}

const lesson = introductoryLesson;
const lessonRules = RULES.filter(rule => lesson.allowedRuleIds.includes(rule.id));

function historyEntry(
  forms: FormForest,
  appliedRuleId?: string,
  matchPath?: FormPath,
  matchPathLabel?: string,
): HistoryEntry {
  return {
    forms: cloneForest(forms),
    appliedRuleId,
    matchPath: matchPath ? [...matchPath] : undefined,
    matchPathLabel,
  };
}

export function Sandbox() {
  const [history, setHistory] = useState<HistoryEntry[]>([historyEntry(lesson.initialForms)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(lessonRules[0]?.id ?? null);

  const current = history[historyIndex];
  const currentForms = current.forms;

  const selectedRule = useMemo<Rule | undefined>(() => {
    if (!selectedRuleId) return undefined;
    return lessonRules.find(rule => rule.id === selectedRuleId);
  }, [selectedRuleId]);

  const matches = useMemo(() => {
    if (!selectedRule) return [];
    return enumerateMatches(selectedRule, currentForms);
  }, [selectedRule, currentForms]);

  const goalReached = isGoalReached(currentForms, lesson.goalForms);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  function handleUndo() {
    if (!canUndo) return;
    setHistoryIndex(index => Math.max(0, index - 1));
  }

  function handleRedo() {
    if (!canRedo) return;
    setHistoryIndex(index => Math.min(history.length - 1, index + 1));
  }

  function handleSelectRule(ruleId: string) {
    setSelectedRuleId(ruleId);
  }

  function handleApplyMatch(match: RuleMatch) {
    if (!selectedRule) return;
    const nextForms = applyRule(currentForms, selectedRule, match);
    const truncatedHistory = history.slice(0, historyIndex + 1);
    const nextHistory = [
      ...truncatedHistory,
      historyEntry(
        nextForms,
        selectedRule.id,
        match.meta.path,
        describePath(currentForms, match.meta.path),
      ),
    ];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-8 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">James Algebra Tutor</h1>
        <div>
          <h2 className="text-xl font-medium">{lesson.title}</h2>
          <p className="text-sm text-slate-500">{lesson.description}</p>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Sandbox
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                onClick={handleUndo}
                disabled={!canUndo}
              >
                Undo
              </button>
              <button
                type="button"
                className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                onClick={handleRedo}
                disabled={!canRedo}
              >
                Redo
              </button>
            </div>
          </div>

          <div className="rounded border border-slate-200 bg-slate-50 p-4 font-mono text-sm">
            {formatForest(currentForms)}
          </div>

          <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-medium">Goal</p>
            <p className="font-mono">{formatForest(lesson.goalForms)}</p>
            <p className="mt-2 text-xs uppercase tracking-wide">
              {goalReached ? "Goal met" : "Keep transforming"}
            </p>
          </div>
        </div>

        <aside className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Rules</h3>
            <div className="mt-2 flex flex-col gap-2">
              {lessonRules.map(rule => (
                <button
                  key={rule.id}
                  type="button"
                  className={`rounded border px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                    selectedRuleId === rule.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-800"
                  }`}
                  onClick={() => handleSelectRule(rule.id)}
                >
                  <span className="block font-medium">{rule.label}</span>
                  <span className="text-xs text-slate-500">{rule.summary}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Matches</h3>
            {selectedRule && matches.length === 0 && (
              <p className="text-sm text-slate-500">No matches available.</p>
            )}
            <div className="mt-2 flex flex-col gap-2">
              {matches.map(match => (
                <button
                  key={match.meta.path.join("-")}
                  type="button"
                  className="rounded border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50"
                  onClick={() => handleApplyMatch(match)}
                >
                  <span className="block font-medium">
                    {describePath(currentForms, match.meta.path)}
                  </span>
                  {match.meta.description && (
                    <span className="text-xs text-slate-500">{match.meta.description}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Hints</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {lesson.hints.map(hint => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">History</h3>
        <ol className="mt-2 space-y-1 text-sm">
          {history.map((entry, index) => {
            const isCurrent = index === historyIndex;
            const isLatest = index === history.length - 1;
            const textClass = isCurrent ? "text-slate-900 font-semibold" : "text-slate-600";
            const highlightClass = isLatest ? "border border-amber-300 bg-amber-50" : "border border-transparent";

            return (
              <li key={index} className={`rounded px-2 py-1 ${textClass} ${highlightClass}`}>
                <span className="font-mono">{formatForest(entry.forms)}</span>
                {entry.appliedRuleId && (
                  <span className="text-xs text-slate-500">
                    {" "}— {entry.appliedRuleId} at {entry.matchPathLabel ?? "n/a"}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}

export default Sandbox;
