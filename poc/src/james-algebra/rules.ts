/**
 * James Algebra - Transformation Rules
 * 
 * Implements the computational axioms:
 * - Dominion: a ( ) = ( )
 * - Involution: ((a)) = a
 * - Pervasion: a (a b) = a (b)
 */

import { Form, Container, isContainer, isEmpty, container, empty } from './types';

/**
 * Result of attempting a transformation
 */
export interface TransformResult {
  success: boolean;
  result?: Form;
  ruleName?: string;
}

/**
 * Apply Involution: ((a)) = a
 * 
 * Pattern: A container containing exactly one container.
 * The outer container is removed.
 */
export function involution(form: Form): TransformResult {
  if (!isContainer(form)) {
    return { success: false };
  }
  
  // Must have exactly one child
  if (form.contents.length !== 1) {
    return { success: false };
  }
  
  const child = form.contents[0];
  
  // Child must be a container
  if (!isContainer(child)) {
    return { success: false };
  }
  
  // Success! Return the inner container's contents wrapped in a container
  // ((a)) -> a means we return what's inside the inner container
  return {
    success: true,
    result: child,
    ruleName: 'Involution'
  };
}

/**
 * Apply Dominion: a () = ()
 * 
 * Pattern: A container with at least one empty container.
 * All other contents become void-equivalent, leaving just ().
 */
export function dominion(form: Form): TransformResult {
  if (!isContainer(form)) {
    return { success: false };
  }
  
  // Check if any child is an empty container
  const hasEmptyContainer = form.contents.some(child => 
    isContainer(child) && 
    (child.contents.length === 0 || 
     (child.contents.length === 1 && isEmpty(child.contents[0])))
  );
  
  if (!hasEmptyContainer) {
    return { success: false };
  }
  
  // Return a container with just empty
  return {
    success: true,
    result: container([empty()]),
    ruleName: 'Dominion'
  };
}

/**
 * Apply Pervasion (shallow): a (a b) = a (b)
 * 
 * Pattern: A container with a form 'a' and another container that also contains 'a'.
 * The replica of 'a' inside the nested container is removed.
 * 
 * Note: This is simplified shallow pervasion. Deep pervasion requires
 * traversing arbitrary depths.
 */
export function pervasion(form: Form): TransformResult {
  if (!isContainer(form)) {
    return { success: false };
  }
  
  // Look for a mark that appears both at this level and nested one level deeper
  // This is a simplified implementation
  
  // Find all marks at this level
  const marksAtThisLevel = form.contents.filter(child => child.type === 'mark');
  
  if (marksAtThisLevel.length === 0) {
    return { success: false };
  }
  
  // Find all containers at this level
  const containersAtThisLevel = form.contents.filter(isContainer);
  
  if (containersAtThisLevel.length === 0) {
    return { success: false };
  }
  
  // Check if any mark appears in any nested container
  for (const mark of marksAtThisLevel) {
    for (let i = 0; i < containersAtThisLevel.length; i++) {
      const nestedContainer = containersAtThisLevel[i];
      const hasReplica = nestedContainer.contents.some(
        child => child.type === 'mark' && child.name === (mark as any).name
      );
      
      if (hasReplica) {
        // Found a match! Remove the replica from the nested container
        const newNestedContents = nestedContainer.contents.filter(
          child => !(child.type === 'mark' && child.name === (mark as any).name)
        );
        
        // Rebuild the form with the modified nested container
        const newContents = form.contents.map((child, idx) => {
          if (child === containersAtThisLevel[i]) {
            return container(newNestedContents.length > 0 ? newNestedContents : [empty()]);
          }
          return child;
        });
        
        return {
          success: true,
          result: container(newContents),
          ruleName: 'Pervasion'
        };
      }
    }
  }
  
  return { success: false };
}

/**
 * Try all rules on a form and return the first successful transformation
 */
export function applyAnyRule(form: Form): TransformResult {
  const rules = [involution, dominion, pervasion];
  
  for (const rule of rules) {
    const result = rule(form);
    if (result.success) {
      return result;
    }
  }
  
  return { success: false };
}

/**
 * Recursively try to apply rules to a form and all its subforms
 */
export function applyRuleRecursive(form: Form, ruleFn: (f: Form) => TransformResult): TransformResult {
  // Try to apply to this form first
  const result = ruleFn(form);
  if (result.success) {
    return result;
  }
  
  // If this is a container, try applying to children
  if (isContainer(form)) {
    for (let i = 0; i < form.contents.length; i++) {
      const childResult = applyRuleRecursive(form.contents[i], ruleFn);
      if (childResult.success) {
        // Rebuild container with transformed child
        const newContents = [...form.contents];
        newContents[i] = childResult.result!;
        return {
          success: true,
          result: container(newContents),
          ruleName: childResult.ruleName
        };
      }
    }
  }
  
  return { success: false };
}
