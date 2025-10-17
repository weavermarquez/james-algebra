import type { Form, FormForest, FormPath } from "./types";

export function cloneForm(form: Form): Form {
  return {
    boundary: form.boundary,
    children: form.children.map(cloneForm),
  };
}

export function cloneForest(forms: FormForest): FormForest {
  return forms.map(cloneForm);
}

export function formsEqual(a: Form, b: Form): boolean {
  if (a.boundary !== b.boundary) return false;
  if (a.children.length !== b.children.length) return false;
  return a.children.every((child, index) => formsEqual(child, b.children[index]));
}

export function forestsEqual(a: FormForest, b: FormForest): boolean {
  if (a.length !== b.length) return false;
  return a.every((form, index) => formsEqual(form, b[index]));
}

export interface LookupResult {
  node: Form;
  parent: Form | null;
  parentPath: FormPath | null;
  path: FormPath;
}

export function getFormAtPath(forms: FormForest, path: FormPath): LookupResult {
  if (path.length === 0) {
    throw new Error("Root path must include at least one index");
  }

  let currentParent: Form | null = null;
  let currentForms: FormForest = forms;
  let currentPath: number[] = [];

  for (let depth = 0; depth < path.length; depth += 1) {
    const index = path[depth];
    if (index < 0 || index >= currentForms.length) {
      throw new Error(`Path ${path.join(".")} is out of bounds`);
    }

    const currentNode = currentForms[index];

    if (depth === path.length - 1) {
      return {
        node: currentNode,
        parent: currentParent,
        parentPath: currentParent ? [...currentPath] : null,
        path: [...currentPath, index],
      };
    }

    currentParent = currentNode;
    currentPath = [...currentPath, index];
    currentForms = currentNode.children;
  }

  throw new Error(`Failed to resolve path ${path.join(".")}`);
}

export function updateFormAtPath(
  forms: FormForest,
  path: FormPath,
  updater: (current: Form) => Form,
): FormForest {
  if (path.length === 0) {
    throw new Error("Root path must include at least one index");
  }

  const [head, ...tail] = path;
  if (head < 0 || head >= forms.length) {
    throw new Error(`Path ${path.join(".")} is out of bounds`);
  }

  const updatedForms = forms.map((form, index) => {
    if (index !== head) return form;
    if (tail.length === 0) {
      return updater(form);
    }
    return {
      ...form,
      children: updateFormAtPath(form.children, tail, updater),
    };
  });

  return updatedForms;
}

export function replaceFormAtPath(forms: FormForest, path: FormPath, replacement: Form): FormForest {
  return updateFormAtPath(forms, path, () => replacement);
}

export function visitForms(
  forms: FormForest,
  visitor: (entry: LookupResult) => void,
  basePath: FormPath = [],
  parent: Form | null = null,
): void {
  forms.forEach((node, index) => {
    const path = [...basePath, index];
    visitor({ node, parent, parentPath: parent ? basePath : null, path });
    if (node.children.length > 0) {
      visitForms(node.children, visitor, path, node);
    }
  });
}
