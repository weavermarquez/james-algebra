import {
  atom,
  container,
  forest,
  wrapRound,
  wrapSquare,
  makeUnit,
  FormNode,
} from "@/lib/james-algebra";

const simpleDemo: FormNode = forest([
  wrapRound(wrapSquare(atom("alpha"))),
  wrapSquare(wrapRound(atom("beta"))),
  container("angle", forest([makeUnit(), atom("gamma")])),
]);

export const demoForm = simpleDemo;
