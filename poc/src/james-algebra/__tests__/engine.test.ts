import { describe, expect, it } from "bun:test";

import { applyRule, enumerateMatches, isGoalReached } from "../engine";
import { round, square } from "../factories";
import { cloneForm, formsEqual, forestsEqual } from "../structure";
import { RULES, getRuleById } from "../rules";
import type { Form, FormForest } from "../types";

const ENFOLD_RULE_ID = "axiom.enfold";
const CLARIFY_RULE_ID = "axiom.clarify";

function makeUnit(): Form {
  return round();
}

function makeEnfoldedUnit(): Form {
  return round(square(round()));
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
  it("enfold applies to the unit and produces the inversion shell", () => {
    const enfoldRule = getRuleById(ENFOLD_RULE_ID);
    expect(enfoldRule).toBeDefined();
    if (!enfoldRule) return;

    const initialForms: FormForest = [makeUnit()];
    const matches = enumerateMatches(enfoldRule, initialForms);
    expect(matches.length).toBe(1);
    expect(matches[0].meta.path).toEqual([0]);

    const next = applyRule(initialForms, enfoldRule, matches[0]);
    expect(forestsEqual(next, [makeEnfoldedUnit()])).toBe(true);
  });

  it("clarify cancels an inversion pair", () => {
    const clarifyRule = getRuleById(CLARIFY_RULE_ID);
    expect(clarifyRule).toBeDefined();
    if (!clarifyRule) return;

    const initialForms: FormForest = [makeEnfoldedUnit()];
    const matches = enumerateMatches(clarifyRule, initialForms);
    expect(matches.length).toBe(1);
    expect(matches[0].meta.path).toEqual([0]);

    const next = applyRule(initialForms, clarifyRule, matches[0]);
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
