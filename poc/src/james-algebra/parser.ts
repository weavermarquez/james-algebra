/**
 * James Algebra - Parens Parser
 * 
 * Converts parens notation strings to Form AST.
 * Examples:
 *   "()"     -> Container with Empty
 *   "((a))"  -> Container containing Container containing Mark('a')
 *   "(a b)"  -> Container with Mark('a') and Mark('b')
 */

import { Form, Container, Mark, Empty, empty, mark, container } from './types';

export class ParseError extends Error {
  constructor(message: string, public position: number) {
    super(`Parse error at position ${position}: ${message}`);
    this.name = 'ParseError';
  }
}

/**
 * Parse a parens notation string into a Form AST.
 */
export function parse(input: string): Form {
  const tokens = tokenize(input);
  const [form, remaining] = parseForm(tokens);
  
  if (remaining.length > 0) {
    throw new ParseError('Unexpected tokens after parsing', 0);
  }
  
  return form;
}

/**
 * Tokenize input string into meaningful tokens.
 */
type Token = 
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'ident', value: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  
  while (i < input.length) {
    const char = input[i];
    
    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    
    // Left paren
    if (char === '(') {
      tokens.push({ type: 'lparen' });
      i++;
      continue;
    }
    
    // Right paren
    if (char === ')') {
      tokens.push({ type: 'rparen' });
      i++;
      continue;
    }
    
    // Identifier (variable name)
    if (/[a-zA-Z_]/.test(char)) {
      let ident = '';
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        ident += input[i];
        i++;
      }
      tokens.push({ type: 'ident', value: ident });
      continue;
    }
    
    throw new ParseError(`Unexpected character '${char}'`, i);
  }
  
  return tokens;
}

/**
 * Parse a single form from tokens.
 * Returns [parsed form, remaining tokens].
 */
function parseForm(tokens: Token[]): [Form, Token[]] {
  if (tokens.length === 0) {
    return [empty(), []];
  }
  
  const first = tokens[0];
  
  // Container: ( ... )
  if (first.type === 'lparen') {
    return parseContainer(tokens);
  }
  
  // Mark: identifier
  if (first.type === 'ident') {
    return [mark(first.value), tokens.slice(1)];
  }
  
  // Empty (no tokens, or we're done)
  return [empty(), tokens];
}

/**
 * Parse a container: ( contents... )
 */
function parseContainer(tokens: Token[]): [Container, Token[]] {
  if (tokens[0].type !== 'lparen') {
    throw new ParseError('Expected (', 0);
  }
  
  let remaining = tokens.slice(1); // consume '('
  const contents: Form[] = [];
  
  // Parse contents until we hit ')'
  while (remaining.length > 0 && remaining[0].type !== 'rparen') {
    const [form, rest] = parseForm(remaining);
    
    // Only add non-empty forms to contents
    if (form.type !== 'empty') {
      contents.push(form);
    }
    
    remaining = rest;
  }
  
  // Consume ')'
  if (remaining.length === 0 || remaining[0].type !== 'rparen') {
    throw new ParseError('Expected )', 0);
  }
  remaining = remaining.slice(1);
  
  // If no contents, this is an empty container
  if (contents.length === 0) {
    contents.push(empty());
  }
  
  return [container(contents), remaining];
}

/**
 * Convert a Form back to parens notation string.
 */
export function unparse(form: Form): string {
  switch (form.type) {
    case 'empty':
      return '';
    case 'mark':
      return form.name;
    case 'container':
      if (form.contents.length === 0) {
        return '()';
      }
      if (form.contents.length === 1 && form.contents[0].type === 'empty') {
        return '()';
      }
      const inner = form.contents.map(unparse).filter(s => s.length > 0).join(' ');
      return `(${inner})`;
  }
}
