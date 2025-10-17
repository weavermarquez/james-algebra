import type { BoundaryKind, Form } from "./types";
import { cloneForm } from "./structure";

function createForm(boundary: BoundaryKind, children: Form[] = []): Form {
  return {
    boundary,
    children: children.map(child => cloneForm(child)),
  };
}

export const round = (...children: Form[]): Form => createForm("round", children);
export const square = (...children: Form[]): Form => createForm("square", children);
export const angle = (...children: Form[]): Form => createForm("angle", children);

export function fromJSON(form: Form): Form {
  return cloneForm(form);
}
