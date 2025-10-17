import { describe, expect, it } from "bun:test";

import { applyRule, enumerateMatches, isGoalReached } from "../engine";
import { round, square } from "../factories";
import { cloneForm, formsEqual, forestsEqual } from "../structure";
import { RULES, getRuleById } from "../rules";
import { transformWithProlog, transformWithPrologAll } from "../prolog/engine";
import type { Form, FormForest } from "../types";

const ENFOLD_RULE_ID = "axiom.enfold";
const CLARIFY_RULE_ID = "axiom.clarify";

function makeUnit(): Form {
  return round();
}

function makeEnfoldedUnit(): Form {
  return round(square(round()));
}

function makeAlternateEnfoldedUnit(): Form {
  return square(round(makeUnit()));
}

describe("structure helpers", () => {
  it("clones forms deeply", () => {
    const original = makeEnfoldedUnit();
    const cloned = cloneForm(original);

    expect(cloned).not.toBe(original);
    expect(formsEqual(cloned, original)).toBe(true);

    // Mutating the clone should not impact the original
    cloned.children[0].children.push(round());
    expect(formsEqual(cloned, original)).toBe(false);
  });

  it("compares forests structurally", () => {
    const forestA: FormForest = [makeUnit(), makeEnfoldedUnit()];
    const forestB: FormForest = [makeUnit(), makeEnfoldedUnit()];

    expect(forestsEqual(forestA, forestB)).toBe(true);

    const forestC: FormForest = [makeEnfoldedUnit(), makeUnit()];
    expect(forestsEqual(forestA, forestC)).toBe(false);
  });
});

describe("rules", () => {
  it("enfold applies to the unit and produces the inversion shell", async () => {
    const enfoldRule = getRuleById(ENFOLD_RULE_ID);
    expect(enfoldRule).toBeDefined();
    if (!enfoldRule) return;

    const initialForms: FormForest = [makeUnit()];
    const matches = enumerateMatches(enfoldRule, initialForms);
    expect(matches.length).toBe(1);
    expect(matches[0].meta.path).toEqual([0]);

    const next = await applyRule(initialForms, enfoldRule, matches[0]);
    expect(forestsEqual(next, [makeEnfoldedUnit()])).toBe(true);
  });

  it("clarify cancels an inversion pair", async () => {
    const clarifyRule = getRuleById(CLARIFY_RULE_ID);
    expect(clarifyRule).toBeDefined();
    if (!clarifyRule) return;

    const initialForms: FormForest = [makeEnfoldedUnit()];
    const matches = enumerateMatches(clarifyRule, initialForms);
    expect(matches.length).toBe(1);
    expect(matches[0].meta.path).toEqual([0]);

    const next = await applyRule(initialForms, clarifyRule, matches[0]);
    expect(forestsEqual(next, [makeUnit()])).toBe(true);
  });
});

describe("goals", () => {
  it("recognises the lesson goal once reached", () => {
    const goal = [makeEnfoldedUnit()];
    const notGoal = [makeUnit()];

    expect(isGoalReached(goal, goal)).toBe(true);
    expect(isGoalReached(notGoal, goal)).toBe(false);
  });
});

describe("prolog transforms", () => {
  it("enfold matches the expected inversion shell", async () => {
    const result = await transformWithProlog("enfold", makeUnit());
    expect(formsEqual(result, makeEnfoldedUnit())).toBe(true);
  });

  it("clarify removes the inversion shell", async () => {
    const result = await transformWithProlog("clarify", makeEnfoldedUnit());
    expect(formsEqual(result, makeUnit())).toBe(true);
  });

  it("enfold produces both inversion shells", async () => {
    const results = await transformWithPrologAll("enfold", makeUnit());
    expect(results.length).toBe(2);
    expect(results.some((form) => formsEqual(form, makeEnfoldedUnit()))).toBe(true);
    expect(
      results.some((form) => formsEqual(form, makeAlternateEnfoldedUnit())),
    ).toBe(true);
  });

  it("clarify removes the square-first inversion shell", async () => {
    const result = await transformWithProlog(
      "clarify",
      makeAlternateEnfoldedUnit(),
    );
    expect(formsEqual(result, makeUnit())).toBe(true);
  });
});
