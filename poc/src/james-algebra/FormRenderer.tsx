/**
 * James Algebra - Form Renderer
 * 
 * Renders James Forms as nested SVG rectangles (boxes).
 * Visual dialect: 2D boxes (simplified from parens).
 */

import React from 'react';
import { Form, isContainer, isMark, isEmpty } from './types';

interface FormRendererProps {
  form: Form;
  /** Optional callback when a form is clicked */
  onFormClick?: (form: Form) => void;
  /** ID of currently selected form */
  selectedId?: string;
}

/**
 * Layout constants
 */
const PADDING = 20;
const MIN_BOX_WIDTH = 60;
const MIN_BOX_HEIGHT = 60;
const MARK_WIDTH = 30;
const MARK_HEIGHT = 40;
const SPACING = 10;

/**
 * Computed layout for a form
 */
interface Layout {
  width: number;
  height: number;
  x: number;
  y: number;
}

/**
 * Main renderer component
 */
export function FormRenderer({ form, onFormClick, selectedId }: FormRendererProps) {
  const layout = computeLayout(form);
  
  return (
    <svg 
      width={layout.width + PADDING * 2} 
      height={layout.height + PADDING * 2}
      className="border border-gray-300 bg-white"
    >
      <g transform={`translate(${PADDING}, ${PADDING})`}>
        <RenderForm 
          form={form} 
          layout={layout} 
          onFormClick={onFormClick}
          selectedId={selectedId}
        />
      </g>
    </svg>
  );
}

/**
 * Recursively render a form
 */
function RenderForm({ 
  form, 
  layout, 
  onFormClick,
  selectedId 
}: { 
  form: Form; 
  layout: Layout;
  onFormClick?: (form: Form) => void;
  selectedId?: string;
}) {
  const isSelected = isContainer(form) && form.id === selectedId;
  
  if (isEmpty(form)) {
    // Empty forms don't render (they're void)
    return null;
  }
  
  if (isMark(form)) {
    return (
      <g>
        <text
          x={layout.x + layout.width / 2}
          y={layout.y + layout.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xl font-semibold select-none"
          style={{ fill: '#2563eb' }}
        >
          {form.name}
        </text>
      </g>
    );
  }
  
  if (isContainer(form)) {
    const childLayouts = computeChildLayouts(form);
    
    return (
      <g>
        {/* Container box */}
        <rect
          x={layout.x}
          y={layout.y}
          width={layout.width}
          height={layout.height}
          fill={isSelected ? '#dbeafe' : 'none'}
          stroke={isSelected ? '#2563eb' : '#6b7280'}
          strokeWidth={isSelected ? 3 : 2}
          rx={4}
          className="cursor-pointer hover:stroke-blue-400 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onFormClick?.(form);
          }}
        />
        
        {/* Render children */}
        {form.contents.map((child, i) => (
          <RenderForm
            key={i}
            form={child}
            layout={childLayouts[i]}
            onFormClick={onFormClick}
            selectedId={selectedId}
          />
        ))}
      </g>
    );
  }
  
  return null;
}

/**
 * Compute layout dimensions for a form
 */
function computeLayout(form: Form, x = 0, y = 0): Layout {
  if (isEmpty(form)) {
    return { x, y, width: 0, height: 0 };
  }
  
  if (isMark(form)) {
    return { 
      x, 
      y, 
      width: MARK_WIDTH, 
      height: MARK_HEIGHT 
    };
  }
  
  if (isContainer(form)) {
    // Special case: empty container
    if (form.contents.length === 0 || 
        (form.contents.length === 1 && isEmpty(form.contents[0]))) {
      return {
        x,
        y,
        width: MIN_BOX_WIDTH,
        height: MIN_BOX_HEIGHT
      };
    }
    
    // Compute layouts for children
    const childLayouts = form.contents.map(child => 
      computeLayout(child, 0, 0)
    );
    
    // Horizontal layout: place children side-by-side
    const totalChildWidth = childLayouts.reduce((sum, l) => sum + l.width, 0);
    const totalSpacing = Math.max(0, (childLayouts.length - 1) * SPACING);
    const maxChildHeight = Math.max(...childLayouts.map(l => l.height));
    
    const innerWidth = totalChildWidth + totalSpacing;
    const innerHeight = maxChildHeight;
    
    return {
      x,
      y,
      width: Math.max(MIN_BOX_WIDTH, innerWidth + PADDING * 2),
      height: Math.max(MIN_BOX_HEIGHT, innerHeight + PADDING * 2)
    };
  }
  
  return { x, y, width: 0, height: 0 };
}

/**
 * Compute layouts for all children of a container
 */
function computeChildLayouts(container: Form): Layout[] {
  if (!isContainer(container)) {
    return [];
  }
  
  const childLayouts = container.contents.map(child => 
    computeLayout(child, 0, 0)
  );
  
  // Position children horizontally with spacing
  let currentX = PADDING;
  const maxChildHeight = Math.max(...childLayouts.map(l => l.height), 0);
  
  return childLayouts.map((layout) => {
    const positioned = {
      ...layout,
      x: currentX,
      y: PADDING + (maxChildHeight - layout.height) / 2 // vertical center
    };
    currentX += layout.width + SPACING;
    return positioned;
  });
}
