/**
 * James Algebra - Core Type Definitions
 * 
 * Representation of James Forms as an AST.
 * Starting with parens dialect (1D).
 */

/** 
 * A Form is the basic unit of James Algebra.
 * It can be:
 * - Empty: void/nothing
 * - Mark: a named variable/atom (like 'a', 'b', 'x')
 * - Container: a distinction boundary containing other forms
 */
export type Form = Empty | Mark | Container;

/** The void - no form */
export interface Empty {
  type: 'empty';
}

/** A named mark/variable */
export interface Mark {
  type: 'mark';
  name: string;
}

/** A container (boundary/distinction) holding other forms */
export interface Container {
  type: 'container';
  contents: Form[];
  // For selection/interaction
  id?: string;
}

/**
 * Helper constructors
 */
export const empty = (): Empty => ({ type: 'empty' });
export const mark = (name: string): Mark => ({ type: 'mark', name });
export const container = (contents: Form[], id?: string): Container => ({ 
  type: 'container', 
  contents,
  id 
});

/**
 * Type guards
 */
export function isEmpty(form: Form): form is Empty {
  return form.type === 'empty';
}

export function isMark(form: Form): form is Mark {
  return form.type === 'mark';
}

export function isContainer(form: Form): form is Container {
  return form.type === 'container';
}
