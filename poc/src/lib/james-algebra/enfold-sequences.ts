import {
  angle,
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

const makeUnits = (count: number): FormNode[] =>
  Array.from({ length: count }, () => round());

const expectedUnit = () => ({ boundary: "round", children: [] as unknown[] });

const expectedUnits = (count: number) =>
  Array.from({ length: count }, expectedUnit);

const expectedRoundContainer = (children: unknown[]) => ({
  boundary: "round",
  children,
});

const expectedSquareContainer = (children: unknown[]) => ({
  boundary: "square",
  children,
});

const expectedAngleContainer = (children: unknown[]) => ({
  boundary: "angle",
  children,
});

const squareOfUnits = (count: number): FormNode => square(...makeUnits(count));

const doubleSquareOfUnits = (count: number): FormNode =>
  square(square(...makeUnits(count)));

const expectedDoubleSquareOfUnits = (count: number) =>
  expectedSquareContainer([expectedSquareContainer(expectedUnits(count))]);

const getNodeAtPath = (form: FormNode, path: number[]): FormNode => {
  let current = form;
  for (const index of path) {
    const children = current.children ?? [];
    const next = children[index];
    if (!next) {
      throw new Error(
        `Path ${path.join("/")} is invalid for node ${current.label}`,
      );
    }
    current = next;
  }
  return current;
};

const getForestAtPath = (form: FormNode, path: number[]): FormNode => {
  const node = getNodeAtPath(form, path);
  if (node.label !== "forest") {
    throw new Error(
      `Expected forest at path ${path.join("/")}, received ${node.label}`,
    );
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
    name: "arithmetic_addition_4_plus_2",
    title: "Addition :: 4 + 2 -> 6",
    conventional: "4 + 2 = 6",
    showLegend: true,
    steps: [
      {
        label: "Keep 4 and 2 in separate piles",
        form: forest([...makeUnits(4), ...makeUnits(2)]),
        expected: expectedUnits(6),
      },
      {
        label: "Collect everything into one container",
        form: forest(makeUnits(6)),
        expected: expectedUnits(6),
      },
    ],
  },
  {
    name: "arithmetic_subtraction_4_minus_2",
    title: "Subtraction :: 4 - 2 -> 2",
    conventional: "4 - 2 = 2",
    showLegend: true,
    steps: [
      {
        label: "Show the minuend and the inverted pair",
        form: forest([...makeUnits(4), angle(...makeUnits(2))]),
        expected: [
          ...expectedUnits(4),
          expectedAngleContainer(expectedUnits(2)),
        ],
      },
      {
        label: "Cancel the inverted pair",
        form: forest([...makeUnits(2)]),
        expected: [...expectedUnits(2)],
      },
    ],
  },
  {
    name: "arithmetic_multiplication_4_times_2",
    title: "Multiplication :: 4 x 2 -> 8",
    conventional: "4 x 2 = 8",
    showLegend: true,
    steps: [
      {
        label: "Pack factors into one frame",
        form: forest([round(square(...makeUnits(4)), square(...makeUnits(2)))]),
        expected: [
          expectedRoundContainer([
            expectedSquareContainer(expectedUnits(4)),
            expectedSquareContainer(expectedUnits(2)),
          ]),
        ],
      },
      {
        label: "Duplicate the square context",
        form: forest([
          round(square(...makeUnits(4)), square(...makeUnits(1))),
          round(square(...makeUnits(4)), square(...makeUnits(1))),
        ]),
        expected: [
          expectedRoundContainer([
            expectedSquareContainer(expectedUnits(4)),
            expectedSquareContainer(expectedUnits(1)),
          ]),
          expectedRoundContainer([
            expectedSquareContainer(expectedUnits(4)),
            expectedSquareContainer(expectedUnits(1)),
          ]),
        ],
      },
      {
        label: "Clarify the inner square",
        form: forest([
          round(square(...makeUnits(4))),
          round(square(...makeUnits(4))),
        ]),
        expected: [
          expectedRoundContainer([expectedSquareContainer(expectedUnits(4))]),
          expectedRoundContainer([expectedSquareContainer(expectedUnits(4))]),
        ],
      },
      {
        label: "Unroll into two sets of four",
        form: forest([...makeUnits(4), ...makeUnits(4)]),
        expected: [...expectedUnits(4), ...expectedUnits(4)],
      },
    ],
  },
  {
    name: "arithmetic_division_4_divided_by_2",
    title: "Division :: 4 / 2 -> 2",
    conventional: "4 / 2 = 2",
    showLegend: true,
    steps: [
      {
        label: "Frame the dividend with the divisor",
        form: forest([
          round(square(...makeUnits(4)), angle(square(...makeUnits(2)))),
        ]),
        expected: [
          expectedRoundContainer([
            expectedSquareContainer(expectedUnits(4)),
            expectedAngleContainer([expectedSquareContainer(expectedUnits(2))]),
          ]),
        ],
      },
      {
        label: "Split the share into two frames",
        form: forest([
          round(square(...makeUnits(2)), angle(square(...makeUnits(2)))),
          round(square(...makeUnits(2)), angle(square(...makeUnits(2)))),
        ]),
        expected: [
          expectedRoundContainer([
            expectedSquareContainer(expectedUnits(2)),
            expectedAngleContainer([expectedSquareContainer(expectedUnits(2))]),
          ]),
          expectedRoundContainer([
            expectedSquareContainer(expectedUnits(2)),
            expectedAngleContainer([expectedSquareContainer(expectedUnits(2))]),
          ]),
        ],
      },
      {
        label: "Clarify the quotient",
        form: forest([round(), round()]),
        expected: [expectedUnit(), expectedUnit()],
      },
    ],
  },
  {
    name: "arithmetic_fraction_2_over_4",
    title: "Simplify Fraction :: 2/4 -> 1/2",
    conventional: "2/4 = 1/2",
    showLegend: true,
    steps: [
      {
        label: "Transcribe 2/4 into frames",
        form: forest([round(squareOfUnits(2), angle(squareOfUnits(4)))]),
        expected: [
          expectedRoundContainer([
            expectedSquareContainer(expectedUnits(2)),
            expectedAngleContainer([expectedSquareContainer(expectedUnits(4))]),
          ]),
        ],
      },
      {
        label: "Mark each 'oo' as its own frame",
        form: forest([
          round(
            squareOfUnits(2),
            angle(square(round(squareOfUnits(2)), round(squareOfUnits(2)))),
          ),
        ]),
        expected: [
          expectedRoundContainer([
            expectedSquareContainer(expectedUnits(2)),
            expectedAngleContainer([
              expectedSquareContainer([
                expectedRoundContainer([
                  expectedSquareContainer(expectedUnits(2)),
                ]),
                expectedRoundContainer([
                  expectedSquareContainer(expectedUnits(2)),
                ]),
              ]),
            ]),
          ]),
        ],
      },
      {
        label: "Expose the shared [o] context",
        form: forest([
          round(
            squareOfUnits(2),
            angle(
              square(
                round(squareOfUnits(2), squareOfUnits(1)),
                round(squareOfUnits(2), squareOfUnits(1)),
              ),
            ),
          ),
        ]),
        expected: [
          expectedRoundContainer([
            expectedSquareContainer(expectedUnits(2)),
            expectedAngleContainer([
              expectedSquareContainer([
                expectedRoundContainer([
                  expectedSquareContainer(expectedUnits(2)),
                  expectedSquareContainer(expectedUnits(1)),
                ]),
                expectedRoundContainer([
                  expectedSquareContainer(expectedUnits(2)),
                  expectedSquareContainer(expectedUnits(1)),
                ]),
              ]),
            ]),
          ]),
        ],
      },
      {
        label: "Collect the ([oo] [o]) frames under [oo]",
        form: forest([
          round(
            squareOfUnits(2),
            angle(square(round(squareOfUnits(2), squareOfUnits(2)))),
          ),
        ]),
        expected: [
          expectedRoundContainer([
            expectedSquareContainer(expectedUnits(2)),
            expectedAngleContainer([
              expectedSquareContainer([
                expectedRoundContainer([
                  expectedSquareContainer(expectedUnits(2)),
                  expectedSquareContainer(expectedUnits(2)),
                ]),
              ]),
            ]),
          ]),
        ],
      },
      {
        label: "Clarify the denominator blocks",
        form: forest([
          round(squareOfUnits(2), angle(squareOfUnits(2), squareOfUnits(2))),
        ]),
        expected: [
          expectedRoundContainer([
            expectedSquareContainer(expectedUnits(2)),
            expectedAngleContainer([
              expectedSquareContainer(expectedUnits(2)),
              expectedSquareContainer(expectedUnits(2)),
            ]),
          ]),
        ],
      },
      {
        label: "Split the angle frames",
        form: forest([
          round(
            squareOfUnits(2),
            angle(squareOfUnits(2)),
            angle(squareOfUnits(2)),
          ),
        ]),
        expected: [
          expectedRoundContainer([
            expectedSquareContainer(expectedUnits(2)),
            expectedAngleContainer([expectedSquareContainer(expectedUnits(2))]),
            expectedAngleContainer([expectedSquareContainer(expectedUnits(2))]),
          ]),
        ],
      },
      {
        label: "Cancel the anti-pair",
        form: round(angle(squareOfUnits(2))),
        expected: [
          expectedRoundContainer([
            expectedAngleContainer([expectedSquareContainer(expectedUnits(2))]),
          ]),
        ],
      },
    ],
  },
  {
    name: "arithmetic_exponent_4_squared",
    title: "Exponentiation :: 4^2 -> 16",
    conventional: "4^2 = 16",
    showLegend: true,
    steps: [
      {
        label: "Bind the base to its exponent",
        form: forest([
          round(
            round(square(square(...makeUnits(4))), square(...makeUnits(2))),
          ),
        ]),
        expected: [
          expectedRoundContainer([
            expectedRoundContainer([
              expectedSquareContainer([
                expectedSquareContainer(expectedUnits(4)),
              ]),
              expectedSquareContainer(expectedUnits(2)),
            ]),
          ]),
        ],
      },
      {
        label: "Duplicate the exponent frame",
        form: forest([
          round(
            round(square(square(...makeUnits(4))), square(...makeUnits(1))),
            round(square(square(...makeUnits(4))), square(...makeUnits(1))),
          ),
        ]),
        expected: [
          expectedRoundContainer([
            expectedRoundContainer([
              expectedSquareContainer([
                expectedSquareContainer(expectedUnits(4)),
              ]),
              expectedSquareContainer(expectedUnits(1)),
            ]),
            expectedRoundContainer([
              expectedSquareContainer([
                expectedSquareContainer(expectedUnits(4)),
              ]),
              expectedSquareContainer(expectedUnits(1)),
            ]),
          ]),
        ],
      },
      {
        label: "Remove the unit share from each exponent frame",
        form: forest([
          round(
            round(square(square(...makeUnits(4)))),
            round(square(square(...makeUnits(4)))),
          ),
        ]),
        expected: [
          expectedRoundContainer([
            expectedRoundContainer([
              expectedSquareContainer([
                expectedSquareContainer(expectedUnits(4)),
              ]),
            ]),
            expectedRoundContainer([
              expectedSquareContainer([
                expectedSquareContainer(expectedUnits(4)),
              ]),
            ]),
          ]),
        ],
      },
      {
        label: "Flatten to two copies of the base",
        form: forest([round(square(...makeUnits(4)), square(...makeUnits(4)))]),
        expected: [
          expectedRoundContainer([
            expectedSquareContainer(expectedUnits(4)),
            expectedSquareContainer(expectedUnits(4)),
          ]),
        ],
      },
      {
        label: "Arrange four copies of the base",
        form: forest([
          round(square(...makeUnits(4)), square(...makeUnits(1))),
          round(square(...makeUnits(4)), square(...makeUnits(1))),
          round(square(...makeUnits(4)), square(...makeUnits(1))),
          round(square(...makeUnits(4)), square(...makeUnits(1))),
        ]),
        expected: [
          expectedRoundContainer([
            expectedSquareContainer(expectedUnits(4)),
            expectedSquareContainer(expectedUnits(1)),
          ]),
          expectedRoundContainer([
            expectedSquareContainer(expectedUnits(4)),
            expectedSquareContainer(expectedUnits(1)),
          ]),
          expectedRoundContainer([
            expectedSquareContainer(expectedUnits(4)),
            expectedSquareContainer(expectedUnits(1)),
          ]),
          expectedRoundContainer([
            expectedSquareContainer(expectedUnits(4)),
            expectedSquareContainer(expectedUnits(1)),
          ]),
        ],
      },
      {
        label: "Clarify each base frame",
        form: forest([
          round(square(...makeUnits(4))),
          round(square(...makeUnits(4))),
          round(square(...makeUnits(4))),
          round(square(...makeUnits(4))),
        ]),
        expected: [
          expectedRoundContainer([expectedSquareContainer(expectedUnits(4))]),
          expectedRoundContainer([expectedSquareContainer(expectedUnits(4))]),
          expectedRoundContainer([expectedSquareContainer(expectedUnits(4))]),
          expectedRoundContainer([expectedSquareContainer(expectedUnits(4))]),
        ],
      },
      {
        label: "Unroll sixteen units",
        form: forest([
          ...makeUnits(4),
          ...makeUnits(4),
          ...makeUnits(4),
          ...makeUnits(4),
        ]),
        expected: [
          ...expectedUnits(4),
          ...expectedUnits(4),
          ...expectedUnits(4),
          ...expectedUnits(4),
        ],
      },
    ],
  },
  {
    name: "arithmetic_root_square_root_of_4",
    title: "Square Root :: sqrt(4) -> 2",
    conventional: "sqrt(4) = 2",
    showLegend: true,
    steps: [
      {
        label: "Transcribe sqrt(4) as 4^(1/2)",
        form: forest([
          round(round(square(squareOfUnits(4)), angle(squareOfUnits(2)))),
        ]),
        expected: [
          expectedRoundContainer([
            expectedRoundContainer([
              expectedSquareContainer([
                expectedSquareContainer(expectedUnits(4)),
              ]),
              expectedAngleContainer([
                expectedSquareContainer(expectedUnits(2)),
              ]),
            ]),
          ]),
        ],
      },
      {
        label: "Mark each 'oo' as its own frame",
        form: forest([
          round(
            round(
              square(square(round(squareOfUnits(2)), round(squareOfUnits(2)))),
              angle(squareOfUnits(2)),
            ),
          ),
        ]),
        expected: [
          expectedRoundContainer([
            expectedRoundContainer([
              expectedSquareContainer([
                expectedSquareContainer([
                  expectedRoundContainer([
                    expectedSquareContainer(expectedUnits(2)),
                  ]),
                  expectedRoundContainer([
                    expectedSquareContainer(expectedUnits(2)),
                  ]),
                ]),
              ]),
              expectedAngleContainer([
                expectedSquareContainer(expectedUnits(2)),
              ]),
            ]),
          ]),
        ],
      },
      {
        label: "Expose each [o] inside the denominator",
        form: forest([
          round(
            round(
              square(
                square(
                  round(squareOfUnits(2), squareOfUnits(1)),
                  round(squareOfUnits(2), squareOfUnits(1)),
                ),
              ),
              angle(squareOfUnits(2)),
            ),
          ),
        ]),
        expected: [
          expectedRoundContainer([
            expectedRoundContainer([
              expectedSquareContainer([
                expectedSquareContainer([
                  expectedRoundContainer([
                    expectedSquareContainer(expectedUnits(2)),
                    expectedSquareContainer(expectedUnits(1)),
                  ]),
                  expectedRoundContainer([
                    expectedSquareContainer(expectedUnits(2)),
                    expectedSquareContainer(expectedUnits(1)),
                  ]),
                ]),
              ]),
              expectedAngleContainer([
                expectedSquareContainer(expectedUnits(2)),
              ]),
            ]),
          ]),
        ],
      },
      {
        label: "Collect ([oo] [o]) pairs under [oo]",
        form: forest([
          round(
            round(
              square(square(round(squareOfUnits(2), squareOfUnits(2)))),
              angle(squareOfUnits(2)),
            ),
          ),
        ]),
        expected: [
          expectedRoundContainer([
            expectedRoundContainer([
              expectedSquareContainer([
                expectedSquareContainer([
                  expectedRoundContainer([
                    expectedSquareContainer(expectedUnits(2)),
                    expectedSquareContainer(expectedUnits(2)),
                  ]),
                ]),
              ]),
              expectedAngleContainer([
                expectedSquareContainer(expectedUnits(2)),
              ]),
            ]),
          ]),
        ],
      },
      {
        label: "Clarify each denominator block",
        form: forest([
          round(
            round(
              square(squareOfUnits(2), squareOfUnits(2)),
              angle(squareOfUnits(2)),
            ),
          ),
        ]),
        expected: [
          expectedRoundContainer([
            expectedRoundContainer([
              expectedSquareContainer([
                expectedSquareContainer(expectedUnits(2)),
                expectedSquareContainer(expectedUnits(2)),
              ]),
              expectedAngleContainer([
                expectedSquareContainer(expectedUnits(2)),
              ]),
            ]),
          ]),
        ],
      },
      {
        label: "Mark each '[oo]' as [[oo]]",
        form: forest([
          round(
            round(
              square(
                round(doubleSquareOfUnits(2)),
                round(doubleSquareOfUnits(2)),
              ),
              angle(squareOfUnits(2)),
            ),
          ),
        ]),
        expected: [
          expectedRoundContainer([
            expectedRoundContainer([
              expectedSquareContainer([
                expectedRoundContainer([expectedDoubleSquareOfUnits(2)]),
                expectedRoundContainer([expectedDoubleSquareOfUnits(2)]),
              ]),
              expectedAngleContainer([
                expectedSquareContainer(expectedUnits(2)),
              ]),
            ]),
          ]),
        ],
      },
      {
        label: "Expose the shared [o] inside each [[oo]]",
        form: forest([
          round(
            round(
              square(
                round(doubleSquareOfUnits(2), squareOfUnits(1)),
                round(doubleSquareOfUnits(2), squareOfUnits(1)),
              ),
              angle(squareOfUnits(2)),
            ),
          ),
        ]),
        expected: [
          expectedRoundContainer([
            expectedRoundContainer([
              expectedSquareContainer([
                expectedRoundContainer([
                  expectedDoubleSquareOfUnits(2),
                  expectedSquareContainer(expectedUnits(1)),
                ]),
                expectedRoundContainer([
                  expectedDoubleSquareOfUnits(2),
                  expectedSquareContainer(expectedUnits(1)),
                ]),
              ]),
              expectedAngleContainer([
                expectedSquareContainer(expectedUnits(2)),
              ]),
            ]),
          ]),
        ],
      },
      {
        label: "Collect ([[oo]] [o]) under [[oo]]",
        form: forest([
          round(
            round(
              square(round(doubleSquareOfUnits(2), squareOfUnits(2))),
              angle(squareOfUnits(2)),
            ),
          ),
        ]),
        expected: [
          expectedRoundContainer([
            expectedRoundContainer([
              expectedSquareContainer([
                expectedRoundContainer([
                  expectedDoubleSquareOfUnits(2),
                  expectedSquareContainer(expectedUnits(2)),
                ]),
              ]),
              expectedAngleContainer([
                expectedSquareContainer(expectedUnits(2)),
              ]),
            ]),
          ]),
        ],
      },
      {
        label: "Clarify the base and reciprocal frames",
        form: forest([
          round(
            round(
              doubleSquareOfUnits(2),
              squareOfUnits(2),
              angle(squareOfUnits(2)),
            ),
          ),
        ]),
        expected: [
          expectedRoundContainer([
            expectedRoundContainer([
              expectedDoubleSquareOfUnits(2),
              expectedSquareContainer(expectedUnits(2)),
              expectedAngleContainer([
                expectedSquareContainer(expectedUnits(2)),
              ]),
            ]),
          ]),
        ],
      },
      {
        label: "Cancel the reciprocal pair",
        form: forest([round(round(doubleSquareOfUnits(2)))]),
        expected: [
          expectedRoundContainer([
            expectedRoundContainer([expectedDoubleSquareOfUnits(2)]),
          ]),
        ],
      },
      {
        label: "Clarify the remaining units",
        form: forest([...makeUnits(2)]),
        expected: [...expectedUnits(2)],
      },
    ],
  },
  {
    name: "axiom_arithmetic_existence",
    title: "Arithmetic Axiom :: Existence",
    conventional: "() != void",
    showLegend: true,
    steps: [
      {
        label: "Begin with void",
        form: forest([]),
        expected: [],
      },
      {
        label: "Introduce the unit ()",
        form: forest([round()]),
        expected: [expectedUnit()],
      },
    ],
  },
  {
    name: "axiom_arithmetic_unit_accumulation",
    title: "Arithmetic Axiom :: Unit accumulation",
    conventional: "() () != ()",
    showLegend: true,
    steps: [
      {
        label: "Two distinct units",
        form: forest([round(), round()]),
        expected: [expectedUnit(), expectedUnit()],
      },
      {
        label: "Contrast with a single unit",
        form: forest([round()]),
        expected: [expectedUnit()],
      },
    ],
  },
  {
    name: "axiom_arithmetic_void_inversion",
    title: "Arithmetic Axiom :: Void inversion",
    conventional: "([]) = [()] = void",
    showLegend: true,
    steps: [
      {
        label: "Round enfolding an empty square",
        form: forest([round(square())]),
        expected: [expectedRoundContainer([expectedSquareContainer([])])],
      },
      {
        label: "Square enfolding the unit",
        form: forest([square(round())]),
        expected: [expectedSquareContainer([expectedRoundContainer([])])],
      },
      {
        label: "Clarify to void",
        form: forest([]),
        expected: [],
      },
    ],
  },
  {
    name: "axiom_arithmetic_unit_reflection",
    title: "Arithmetic Axiom :: Unit reflection",
    conventional: "<()> () = void",
    showLegend: true,
    steps: [
      {
        label: "Pair unit with its angle counterpart",
        form: forest([angle(round()), round()]),
        expected: [
          expectedAngleContainer([expectedRoundContainer([])]),
          expectedUnit(),
        ],
      },
      {
        label: "Cancel to void",
        form: forest([]),
        expected: [],
      },
    ],
  },
  {
    name: "axiom_algebra_inversion",
    title: "Algebraic Axiom :: Inversion",
    conventional: "([A]) = [(A)] = A",
    showLegend: true,
    steps: [
      {
        label: "Round enfolding square alpha",
        form: forest([round(square(atom("alpha")))]),
        expected: [
          expectedRoundContainer([expectedSquareContainer(["alpha"])]),
        ],
      },
      {
        label: "Square enfolding round alpha",
        form: forest([square(round(atom("alpha")))]),
        expected: [
          expectedSquareContainer([expectedRoundContainer(["alpha"])]),
        ],
      },
      {
        label: "Clarify to alpha",
        form: forest([atom("alpha")]),
        expected: ["alpha"],
      },
    ],
  },
  {
    name: "axiom_algebra_arrangement",
    title: "Algebraic Axiom :: Arrangement",
    conventional: "(A [B C]) = (A [B])(A [C])",
    showLegend: true,
    steps: [
      {
        label: "Single frame with shared square",
        form: forest([
          round(atom("alpha"), square(atom("beta"), atom("gamma"))),
        ]),
        expected: [
          expectedRoundContainer([
            "alpha",
            expectedSquareContainer(["beta", "gamma"]),
          ]),
        ],
      },
      {
        label: "Distribute the square",
        form: forest([
          round(atom("alpha"), square(atom("beta"))),
          round(atom("alpha"), square(atom("gamma"))),
        ]),
        expected: [
          expectedRoundContainer(["alpha", expectedSquareContainer(["beta"])]),
          expectedRoundContainer(["alpha", expectedSquareContainer(["gamma"])]),
        ],
      },
    ],
  },
  {
    name: "axiom_algebra_reflection",
    title: "Algebraic Axiom :: Reflection",
    conventional: "A <A> = void",
    showLegend: true,
    steps: [
      {
        label: "Introduce alpha and its mirror",
        form: forest([atom("alpha"), angle(atom("alpha"))]),
        expected: ["alpha", expectedAngleContainer(["alpha"])],
      },
      {
        label: "Cancel to void",
        form: forest([]),
        expected: [],
      },
    ],
  },
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
  arithmetic_addition_4_plus_2: [],
  arithmetic_subtraction_4_minus_2: [],
  arithmetic_multiplication_4_times_2: [],
  arithmetic_division_4_divided_by_2: [],
  arithmetic_exponent_4_squared: [],
  arithmetic_root_square_root_of_4: [],
  axiom_arithmetic_existence: [],
  axiom_arithmetic_unit_accumulation: [],
  axiom_arithmetic_void_inversion: [],
  axiom_arithmetic_unit_reflection: [],
  axiom_algebra_inversion: [],
  axiom_algebra_arrangement: [],
  axiom_algebra_reflection: [],
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

export const getEnfoldingSequenceByName = (name: string) =>
  ENFOLDING_SEQUENCES.find((sequence) => sequence.name === name);

export const buildEnfoldingSteps = (
  sequenceName: string,
): {
  forms: FormNode[];
  labels: string[];
} => {
  const sequence = ENFOLDING_SEQUENCES.find(
    (item) => item.name === sequenceName,
  );
  if (!sequence) {
    throw new Error(`Unknown enfolding sequence: ${sequenceName}`);
  }
  const builders = ENFOLDING_COMMAND_BUILDERS[sequence.name] ?? [];

  if (!builders.length || builders.length !== sequence.steps.length - 1) {
    return {
      forms: sequence.steps.map((step) => cloneForm(step.form)),
      labels: sequence.steps.map((step) => step.label),
    };
  }

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
