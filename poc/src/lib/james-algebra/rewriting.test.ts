import { describe, expect, test } from "bun:test";

import {
  atom,
  forest,
  formsToGraphTrees,
  formToReadable,
  makeUnit,
  maybeEmitGraphLink,
  rewriteFormForDisplay,
  toReadable,
  varRef,
  wrapRound,
  wrapSquare,
  cloneTreeWithFreshIndices,
} from "@/lib/james-algebra";

const clarityCases = [
  {
    name: "round_square_single",
    form: forest([wrapRound(wrapSquare(atom("alpha")))]),
    expected: ["alpha"],
  },
  {
    name: "round_square_multi",
    form: forest([
      wrapRound(
        wrapSquare(
          atom("alpha"),
          atom("beta"),
          wrapRound(atom("gamma")),
        ),
      ),
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
    form: forest([wrapSquare(wrapRound(atom("beta")))]),
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

const enfoldingSequences = [
  {
    name: "void",
    steps: [
      {
        label: "void",
        form: forest([]),
        expected: [],
      },
      {
        label: "([])",
        form: forest([wrapRound(wrapSquare())]),
        expected: [
          {
            boundary: "round",
            children: [
              {
                boundary: "square",
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "atom_A",
    steps: [
      {
        label: "A",
        form: forest([atom("A")]),
        expected: ["A"],
      },
      {
        label: "[(A)]",
        form: forest([wrapSquare(wrapRound(atom("A")))]),
        expected: [
          {
            boundary: "square",
            children: [
              {
                boundary: "round",
                children: ["A"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "atom_B",
    steps: [
      {
        label: "B",
        form: forest([atom("B")]),
        expected: ["B"],
      },
      {
        label: "([B])",
        form: forest([wrapRound(wrapSquare(atom("B")))]),
        expected: [
          {
            boundary: "round",
            children: [
              {
                boundary: "square",
                children: ["B"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "partial_units",
    steps: [
      {
        label: "()()()",
        form: forest([makeUnit(), makeUnit(), makeUnit()]),
        expected: [
          { boundary: "round", children: [] },
          { boundary: "round", children: [] },
          { boundary: "round", children: [] },
        ],
      },
      {
        label: "([()()]) ()",
        form: forest([
          wrapRound(wrapSquare(makeUnit(), makeUnit())),
          makeUnit(),
        ]),
        expected: [
          {
            boundary: "round",
            children: [
              {
                boundary: "square",
                children: [
                  { boundary: "round", children: [] },
                  { boundary: "round", children: [] },
                ],
              },
            ],
          },
          { boundary: "round", children: [] },
        ],
      },
    ],
  },
  {
    name: "variable_chain",
    steps: [
      {
        label: "A",
        form: forest([varRef("$A")]),
        expected: [{ variable: "$A" }],
      },
      {
        label: "[(A)]",
        form: forest([wrapSquare(wrapRound(varRef("$A")))]),
        expected: [
          {
            boundary: "square",
            children: [
              {
                boundary: "round",
                children: [{ variable: "$A" }],
              },
            ],
          },
        ],
      },
      {
        label: "([[(A)]])",
        form: forest([
          wrapRound(wrapSquare(wrapSquare(wrapRound(varRef("$A"))))),
        ]),
        expected: [
          {
            boundary: "round",
            children: [
              {
                boundary: "square",
                children: [
                  {
                    boundary: "square",
                    children: [
                      {
                        boundary: "round",
                        children: [{ variable: "$A" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        label: "([[(A)]([])])",
        form: forest([
          wrapRound(
            wrapSquare(
              wrapSquare(wrapRound(varRef("$A"))),
              wrapRound(wrapSquare()),
            ),
          ),
        ]),
        expected: [
          {
            boundary: "round",
            children: [
              {
                boundary: "square",
                children: [
                  {
                    boundary: "square",
                    children: [
                      {
                        boundary: "round",
                        children: [{ variable: "$A" }],
                      },
                    ],
                  },
                  {
                    boundary: "round",
                    children: [
                      {
                        boundary: "square",
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
] as const;

describe("enfolding demonstrations", () => {
  for (const sequence of enfoldingSequences) {
    test(sequence.name, () => {
      const graphTrees = formsToGraphTrees(
        sequence.steps.map((step) => ({ name: step.label, form: step.form })),
      );
      maybeEmitGraphLink(`Enfolding ${sequence.name}`, graphTrees);

      for (const step of sequence.steps) {
        expect(formToReadable(step.form)).toEqual(step.expected);
      }
    });
  }
});
