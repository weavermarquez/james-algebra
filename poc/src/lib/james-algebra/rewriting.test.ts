import { describe, expect, test } from "bun:test";

import {
  atom,
  forest,
  formsToGraphTrees,
  formToReadable,
  maybeEmitGraphLink,
  rewriteFormForDisplay,
  toReadable,
  varRef,
  round,
  square,
  cloneTreeWithFreshIndices,
  cloneForm,
  enfoldSelection,
} from "@/lib/james-algebra";

import {
  ENFOLDING_SEQUENCES,
  ENFOLDING_COMMAND_BUILDERS,
} from "@/lib/james-algebra/enfold-sequences";

import type { EnfoldSelection, FormNode } from "@/lib/james-algebra";

const clarityCases = [
  {
    name: "round_square_single",
    form: forest([round(square(atom("alpha")))]),
    expected: ["alpha"],
  },
  {
    name: "round_square_multi",
    form: forest([
      round(square(atom("alpha"), atom("beta"), round(atom("gamma")))),
    ]),
    expected: [
      "alpha",
      "beta",
      {
        boundary: "round",
        children: ["gamma"],
      },
    ],
  },
  {
    name: "square_round_single",
    form: forest([square(round(atom("beta")))]),
    expected: ["beta"],
  },
] as const;

describe("clarify inversion rules", () => {
  for (const { name, form, expected } of clarityCases) {
    test(name, () => {
      const beforeTree = cloneTreeWithFreshIndices(form);
      const afterTree = rewriteFormForDisplay(form);
      const readable = toReadable(afterTree);

      expect(readable).toEqual(expected);

      maybeEmitGraphLink(`Clarify ${name}`, [
        { name: "Before", tree: beforeTree },
        { name: "After", tree: afterTree },
      ]);
    });
  }
});

describe("enfolding demonstrations", () => {
  for (const sequence of ENFOLDING_SEQUENCES) {
    test(sequence.name, () => {
      const graphTrees = formsToGraphTrees(
        sequence.steps.map((step) => ({ name: step.label, form: step.form })),
      );
      maybeEmitGraphLink(`Enfolding ${sequence.name}`, graphTrees);

      sequence.steps.forEach((step) => {
        expect(formToReadable(step.form)).toEqual(step.expected);
      });
    });
  }
});

describe("enfoldSelection command", () => {
  for (const sequence of ENFOLDING_SEQUENCES) {
    const builders = ENFOLDING_COMMAND_BUILDERS[sequence.name];
    if (!builders) {
      continue;
    }

    test(sequence.name, () => {
      let current: FormNode = cloneForm(sequence.steps[0].form);
      const stepsForGraph: FormNode[] = [cloneForm(sequence.steps[0].form)];

      builders.forEach((buildSelection, index) => {
        const selection: EnfoldSelection = buildSelection(current);
        current = enfoldSelection(current, selection);
        stepsForGraph.push(cloneForm(current));
        const expectedReadable = sequence.steps[index + 1].expected;
        expect(formToReadable(current)).toEqual(expectedReadable);
      });

      const graphTrees = formsToGraphTrees(
        stepsForGraph.map((form, index) => ({
          name: index === 0 ? "original" : `step-${index}`,
          form,
        })),
      );
      maybeEmitGraphLink(`Enfold command ${sequence.name}`, graphTrees);
    });
  }
});
