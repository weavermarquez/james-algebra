import pl from "tau-prolog";
import "tau-prolog/modules/lists";

import type { Form } from "../types";
import { JAMES_ALGEBRA_PROGRAM } from "./program";

const RESOURCE_LIMIT = 10_000;

function consultProgram(session: any, program: string): Promise<void> {
  return new Promise((resolve, reject) => {
    session.consult(program, {
      success: () => resolve(),
      error: (err: string) => {
        reject(new Error(err));
      },
    });
  });
}

function queryGoal(session: any, goal: string): Promise<void> {
  return new Promise((resolve, reject) => {
    session.query(goal, {
      success: () => resolve(),
      error: (err: string) => {
        reject(new Error(err));
      },
    });
  });
}

function fetchAnswer(session: any): Promise<any | null> {
  return new Promise((resolve, reject) => {
    session.answer({
      success: (answer: any) => resolve(answer),
      fail: () => resolve(null),
      error: (err: string) => reject(new Error(err)),
      limit: () =>
        reject(
          new Error(
            "Tau Prolog resource limit reached while searching for an answer",
          ),
        ),
    });
  });
}

async function fetchAllAnswers(session: any): Promise<any[]> {
  const answers: any[] = [];
  while (true) {
    const answer = await fetchAnswer(session);
    if (!answer) break;
    answers.push(answer);
  }
  return answers;
}

function formToPrologTerm(form: Form): string {
  const children = form.children
    .map((child) => formToPrologTerm(child))
    .join(", ");
  return `form(${form.boundary}, [${children}])`;
}

function prologListToArray(listTerm: any): any[] {
  const values: any[] = [];
  let cursor = listTerm;

  while (cursor && cursor.indicator === "./2") {
    values.push(cursor.args[0]);
    cursor = cursor.args[1];
  }

  if (!cursor || cursor.indicator !== "[]/0") {
    throw new Error(
      "Unexpected Tau Prolog list tail encountered while decoding children",
    );
  }

  return values;
}

function termToForm(term: any): Form {
  if (!term || term.indicator !== "form/2") {
    throw new Error("Tau Prolog returned a non-form term");
  }

  const boundaryTerm = term.args[0];
  const childrenTerm = term.args[1];

  if (!boundaryTerm || typeof boundaryTerm.id !== "string") {
    throw new Error("Tau Prolog returned a form with an invalid boundary atom");
  }

  const boundary = boundaryTerm.id as Form["boundary"];
  const children = prologListToArray(childrenTerm).map((childTerm: any) =>
    termToForm(childTerm),
  );

  return {
    boundary,
    children,
  };
}

export async function transformWithProlog(
  predicate: "enfold" | "clarify",
  form: Form,
): Promise<Form> {
  const results = await transformWithPrologAll(predicate, form);
  if (results.length === 0) {
    const goal = `${predicate}(${formToPrologTerm(form)}, Result).`;
    throw new Error(`Tau Prolog produced no answer for goal: ${goal}`);
  }
  return results[0];
}

export async function transformWithPrologAll(
  predicate: "enfold" | "clarify",
  form: Form,
): Promise<Form[]> {
  const session = pl.create(RESOURCE_LIMIT);
  await consultProgram(session, JAMES_ALGEBRA_PROGRAM);

  const goal = `${predicate}(${formToPrologTerm(form)}, Result).`;
  await queryGoal(session, goal);

  const answers = await fetchAllAnswers(session);

  return answers.map((answer) => {
    const resultTerm = answer.lookup("Result");
    if (!resultTerm) {
      throw new Error("Tau Prolog answer did not bind Result");
    }
    return termToForm(resultTerm);
  });
}
