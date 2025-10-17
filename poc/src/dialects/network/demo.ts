import {
  angle,
  atom,
  forest,
  round,
  square,
  FormNode,
} from "@/lib/james-algebra";

const sharedTheta = atom("theta");

const leftStrand = round(
  square(
    atom("alpha"),
    angle(round(), atom("beta")),
    round(sharedTheta),
  ),
);

const middleStrand = square(
  round(atom("gamma")),
  angle(sharedTheta),
  round(atom("delta")),
);

const rightStrand = angle(
  round(round()),
  square(sharedTheta, atom("epsilon")),
);

export const demoForm: FormNode = forest([
  leftStrand,
  round(),
  middleStrand,
  rightStrand,
]);
