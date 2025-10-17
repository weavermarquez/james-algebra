import {
  atom,
  forest,
  round,
  square,
  varRef,
  FormNode,
  cloneForm,
} from "@/lib/james-algebra";
import { enfoldSelection } from "@/lib/james-algebra";
import type { EnfoldSelection } from "@/lib/james-algebra";

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
      throw new Error(
        `Child at index ${index} in forest ${forestNode.label} is missing an id.`,
      );
    }
    return child.id;
  });
};

export const ENFOLDING_SEQUENCES = [
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
        form: forest([round(square())]),
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
        form: forest([square(round(atom("A")))]),
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
        form: forest([round(square(atom("B")))]),
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
        form: forest([round(), round(), round()]),
        expected: [
          { boundary: "round", children: [] },
          { boundary: "round", children: [] },
          { boundary: "round", children: [] },
        ],
      },
      {
        label: "([()()]) ()",
        form: forest([round(square(round(), round())), round()]),
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
        form: forest([square(round(varRef("$A")))]),
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
        form: forest([round(square(square(round(varRef("$A")))))]),
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
          round(square(square(round(varRef("$A"))), round(square()))),
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

export const ENFOLDING_COMMAND_BUILDERS: Record<
  (typeof ENFOLDING_SEQUENCES)[number]["name"],
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

export const getEnfoldingSequenceNames = () =>
  ENFOLDING_SEQUENCES.map((sequence) => sequence.name);

export const buildEnfoldingSteps = (sequenceName: string): {
  forms: FormNode[];
  labels: string[];
} => {
  const sequence = ENFOLDING_SEQUENCES.find((item) => item.name === sequenceName);
  if (!sequence) {
    throw new Error(`Unknown enfolding sequence: ${sequenceName}`);
  }
  const builders = ENFOLDING_COMMAND_BUILDERS[sequence.name] ?? [];

  const forms: FormNode[] = [cloneForm(sequence.steps[0].form)];
  const labels: string[] = [sequence.steps[0].label];

  builders.forEach((buildSelection, index) => {
    const selection = buildSelection(forms[index]);
    const nextForm = enfoldSelection(forms[index], selection);
    forms.push(cloneForm(nextForm));
    labels.push(sequence.steps[index + 1]?.label ?? `step-${index + 1}`);
  });

  return { forms, labels };
};

export { getChildIdsAtPath, getForestAtPath };
