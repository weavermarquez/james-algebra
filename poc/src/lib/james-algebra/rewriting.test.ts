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
  cloneForm,
  enfoldSelection,
} from "@/lib/james-algebra";

import type { EnfoldSelection, FormNode } from "@/lib/james-algebra";
const getNodeAtPath = (form: FormNode, path: number[]): FormNode => {
  let current = form;
  for (const index of path) {
    const children = current.children ?? [];
    const next = children[index];
    if (!next) {
      throw new Error(`Path ${path.join("/")} is invalid for node ${current.label}`);
    }
    current = next;
  }
  return current;
};

const getForestAtPath = (form: FormNode, path: number[]): FormNode => {
  const node = getNodeAtPath(form, path);
  if (node.label !== "forest") {
    throw new Error(`Expected forest at path ${path.join("/")}, received ${node.label}`);
  }
  return node;
};

const getChildIdsAtPath = (form: FormNode, path: number[]): string[] => {
  const forestNode = getForestAtPath(form, path);
  return (forestNode.children ?? []).map((child, index) => {
    if (!child.id) {
      throw new Error(`Child at index ${index} in forest ${forestNode.label} is missing an id.`);
    }
    return child.id;
  });
};

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

const enfoldingCommandBuilders: Record<
  (typeof enfoldingSequences)[number]["name"],
  ((form: FormNode) => EnfoldSelection)[]
> = {
  void: [
    (form) => {
      getForestAtPath(form, []);
      return {
        path: [],
        selectedIds: [],
        boundary: "round",
        insertBeforeId: null,
      };
    },
  ],
  atom_A: [
    (form) => ({
      path: [],
      selectedIds: getChildIdsAtPath(form, []).slice(0, 1),
      boundary: "square",
    }),
  ],
  atom_B: [
    (form) => ({
      path: [],
      selectedIds: getChildIdsAtPath(form, []).slice(0, 1),
      boundary: "round",
    }),
  ],
  partial_units: [
    (form) => ({
      path: [],
      selectedIds: getChildIdsAtPath(form, []).slice(0, 2),
      boundary: "round",
    }),
  ],
  variable_chain: [
    (form) => ({
      path: [],
      selectedIds: getChildIdsAtPath(form, []).slice(0, 1),
      boundary: "square",
    }),
    (form) => ({
      path: [],
      selectedIds: getChildIdsAtPath(form, []).slice(0, 1),
      boundary: "round",
    }),
    (form) => {
      getForestAtPath(form, [0, 0, 0, 0]);
      return {
        path: [0, 0, 0, 0],
        selectedIds: [],
        boundary: "round",
        insertBeforeId: null,
      };
    },
  ],
};

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

describe("enfoldSelection command", () => {
  for (const sequence of enfoldingSequences) {
    const builders = enfoldingCommandBuilders[sequence.name];
    if (!builders) {
      continue;
    }

    test(sequence.name, () => {
      let current = cloneForm(sequence.steps[0].form);
      const stepsForGraph: FormNode[] = [cloneForm(sequence.steps[0].form)];

      builders.forEach((buildSelection, index) => {
        const selection = buildSelection(current);
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
