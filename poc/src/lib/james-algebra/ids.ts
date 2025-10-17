export type FormId = string;

let nextId = 1;

export const resetFormIdCounter = (): void => {
  nextId = 1;
};

export const generateFormId = (): FormId => {
  const id = `f${nextId}`;
  nextId += 1;
  return id;
};
