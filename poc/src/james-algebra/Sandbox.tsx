/**
 * James Algebra - Sandbox Component
 * 
 * Interactive workspace for exploring James Algebra transformations.
 */

import React, { useState } from 'react';
import { Form, container, isContainer } from './types';
import { parse, unparse } from './parser';
import { FormRenderer } from './FormRenderer';
import { involution, dominion, pervasion, applyRuleRecursive, TransformResult } from './rules';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

/**
 * Example forms to get started
 */
const EXAMPLES = [
  { name: 'Involution Example', notation: '((a))' },
  { name: 'Dominion Example', notation: '(a ())' },
  { name: 'Pervasion Example', notation: '(a (a b))' },
  { name: 'Complex Form', notation: '((a) (b (c)))' },
];

export function Sandbox() {
  // Current form being displayed
  const [form, setForm] = useState<Form>(() => parse('((a))'));
  
  // Input field for entering new forms
  const [input, setInput] = useState('((a))');
  
  // Parse error state
  const [parseError, setParseError] = useState<string | null>(null);
  
  // Selected form (for future interaction)
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  
  // Transformation history
  const [history, setHistory] = useState<Form[]>([parse('((a))')]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  /**
   * Handle input change
   */
  const handleInputChange = (value: string) => {
    setInput(value);
    try {
      const parsed = parse(value);
      setForm(parsed);
      setParseError(null);
      addToHistory(parsed);
    } catch (e: any) {
      setParseError(e.message);
    }
  };
  
  /**
   * Load an example
   */
  const loadExample = (notation: string) => {
    setInput(notation);
    handleInputChange(notation);
  };
  
  /**
   * Apply a transformation rule
   */
  const applyRule = (ruleFn: (f: Form) => TransformResult) => {
    const result = applyRuleRecursive(form, ruleFn);
    
    if (result.success && result.result) {
      setForm(result.result);
      setInput(unparse(result.result));
      addToHistory(result.result);
    } else {
      alert(`Cannot apply ${result.ruleName || 'rule'} to current form`);
    }
  };
  
  /**
   * Add form to history
   */
  const addToHistory = (newForm: Form) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newForm);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  /**
   * Undo transformation
   */
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const prevForm = history[newIndex];
      setForm(prevForm);
      setInput(unparse(prevForm));
    }
  };
  
  /**
   * Redo transformation
   */
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextForm = history[newIndex];
      setForm(nextForm);
      setInput(unparse(nextForm));
    }
  };
  
  /**
   * Handle form click (selection)
   */
  const handleFormClick = (clickedForm: Form) => {
    setSelectedForm(clickedForm);
  };
  
  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">James Algebra Sandbox</h1>
        <p className="text-gray-600">
          Interactive workspace for exploring boundary arithmetic
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main canvas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Form Canvas</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Parens Notation
                </label>
                <Input
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Enter parens notation, e.g., ((a))"
                  className="font-mono"
                />
                {parseError && (
                  <p className="text-red-600 text-sm mt-1">{parseError}</p>
                )}
              </div>
              
              {/* Renderer */}
              <div className="flex justify-center items-center min-h-[300px] bg-gray-50 rounded-lg">
                <FormRenderer 
                  form={form} 
                  onFormClick={handleFormClick}
                  selectedId={isContainer(selectedForm) ? selectedForm.id : undefined}
                />
              </div>
              
              {/* History controls */}
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={undo} 
                  disabled={historyIndex === 0}
                  variant="outline"
                  size="sm"
                >
                  ← Undo
                </Button>
                <Button 
                  onClick={redo} 
                  disabled={historyIndex === history.length - 1}
                  variant="outline"
                  size="sm"
                >
                  Redo →
                </Button>
                <div className="ml-auto text-sm text-gray-500 flex items-center">
                  Step {historyIndex + 1} of {history.length}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Transformation Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Transformation Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={() => applyRule(involution)}
                className="w-full justify-start"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-semibold">Involution</div>
                  <div className="text-xs text-gray-500">((a)) = a</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => applyRule(dominion)}
                className="w-full justify-start"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-semibold">Dominion</div>
                  <div className="text-xs text-gray-500">a () = ()</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => applyRule(pervasion)}
                className="w-full justify-start"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-semibold">Pervasion</div>
                  <div className="text-xs text-gray-500">a (a b) = a (b)</div>
                </div>
              </Button>
            </CardContent>
          </Card>
          
          {/* Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {EXAMPLES.map((example, i) => (
                <Button
                  key={i}
                  onClick={() => loadExample(example.notation)}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <div className="text-left">
                    <div className="font-medium text-sm">{example.name}</div>
                    <div className="text-xs font-mono text-gray-500">
                      {example.notation}
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
