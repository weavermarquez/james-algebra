import { applyRules } from "tree-term-rewriting/src/trs";
import { makeEulerTree, treeFromEulerTree, TreeNode } from "tree-term-rewriting/src/tree";

import {
  atom,
  container,
  forest,
  varRef,
  cloneTreeWithFreshIndices,
  flattenForestNodes,
  printGraphLink,
  toReadable,
  ruleDefinitions,
  termRewriteSystem,
  ordering,
  reindexTree,
  FormNode,
} from "./james-algebra-axioms";

type NamedForm = { name: string; form: FormNode };
type LabeledStep = { label: string; form: FormNode };

const wrapRound = (...forms: FormNode[]): FormNode =>
  container("round", forest(forms));

const wrapSquare = (...forms: FormNode[]): FormNode =>
  container("square", forest(forms));

const makeUnit = (): FormNode => wrapRound();

const prepareForDisplay = (tree: TreeNode, startIndex = 1): TreeNode => {
  const display = reindexTree(tree, startIndex);
  flattenForestNodes(display);
  return display;
};

const cloneFormTree = (form: FormNode): TreeNode => cloneTreeWithFreshIndices(form);

const logReadable = (label: string, tree: TreeNode) => {
  console.log(`${label}:`, JSON.stringify(toReadable(tree), null, 2));
};

const clarityDemonstrations: NamedForm[] = [
  {
    name: "round_square_single",
    form: forest([wrapRound(wrapSquare(atom("alpha")))]),
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
  },
  {
    name: "square_round_single",
    form: forest([wrapSquare(wrapRound(atom("beta")))]),
  },
];

function showClarifyRuleGraphs(): void {
  for (const rule of ruleDefinitions) {
    const fromTree = cloneFormTree(rule.from);
    const toTree = cloneFormTree(rule.to);
    printGraphLink(`Rule ${rule.name}`, [
      { name: "From", tree: fromTree },
      { name: "To", tree: toTree },
    ]);
  }
}

function runClarifyDemonstrations(): void {
  for (const demo of clarityDemonstrations) {
    const beforeTree = cloneFormTree(demo.form);
    const beforeDisplay = prepareForDisplay(beforeTree);
    const beforeEuler = makeEulerTree(beforeTree);
    const rewrittenEuler = applyRules(
      beforeEuler,
      termRewriteSystem,
      ordering,
      8,
    );
    const afterTree = treeFromEulerTree(rewrittenEuler);
    const afterDisplay = prepareForDisplay(afterTree);

    printGraphLink(`Demo ${demo.name}`, [
      { name: "Before", tree: beforeTree },
      { name: "After", tree: afterTree },
    ]);

    logReadable(`Before ${demo.name}`, beforeDisplay);
    logReadable(`After ${demo.name}`, afterDisplay);
  }
}

const enfoldingSequences: { name: string; steps: LabeledStep[] }[] = [
  {
    name: "void",
    steps: [
      { label: "void", form: forest([]) },
      {
        label: "([])",
        form: forest([wrapRound(wrapSquare())]),
      },
    ],
  },
  {
    name: "atom_A",
    steps: [
      { label: "A", form: forest([atom("A")]) },
      {
        label: "[(A)]",
        form: forest([wrapSquare(wrapRound(atom("A")))]),
      },
    ],
  },
  {
    name: "atom_B",
    steps: [
      { label: "B", form: forest([atom("B")]) },
      {
        label: "([B])",
        form: forest([wrapRound(wrapSquare(atom("B")))]),
      },
    ],
  },
  {
    name: "partial_units",
    steps: [
      {
        label: "()()()",
        form: forest([makeUnit(), makeUnit(), makeUnit()]),
      },
      {
        label: "([()()]) ()",
        form: forest([
          wrapRound(wrapSquare(makeUnit(), makeUnit())),
          makeUnit(),
        ]),
      },
    ],
  },
  {
    name: "variable_chain",
    steps: [
      {
        label: "A",
        form: forest([varRef("$A")]),
      },
      {
        label: "[(A)]",
        form: forest([wrapSquare(wrapRound(varRef("$A")))]),
      },
      {
        label: "([[(A)]])",
        form: forest([
          wrapRound(wrapSquare(wrapSquare(wrapRound(varRef("$A"))))),
        ]),
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
      },
    ],
  },
];

function runEnfoldingDemonstrations(): void {
  for (const sequence of enfoldingSequences) {
    const trees = sequence.steps.map((step) => ({
      name: step.label,
      tree: cloneFormTree(step.form),
    }));

    printGraphLink(`Enfolding ${sequence.name}`, trees);

    sequence.steps.forEach((step, index) => {
      const display = prepareForDisplay(trees[index].tree);
      logReadable(`Enfolding ${sequence.name} - ${step.label}`, display);
    });
  }
}

showClarifyRuleGraphs();
runClarifyDemonstrations();
runEnfoldingDemonstrations();
