import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { useRunnoStore } from '@/stores/runno-store';
import { LanguageKey } from '@/lib/language-support';
import { indentUnit } from '@codemirror/language';

// Add a simple debounce utility
function debounce(fn: Function, ms = 300) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

interface CodeMirrorEditorProps {
  defaultCode?: string;
  value?: string;
  language: LanguageKey;
  onChange?: (code: string) => void;
}

function CodeMirrorEditor({ 
  defaultCode = '', 
  value,
  language,
  onChange
}: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { setCode } = useRunnoStore();
  const initialCode = value !== undefined ? value : defaultCode;
  
  // Prevent unnecessary re-renders that could cause focus loss
  const prevValueRef = useRef(initialCode);
  
  // Local state for code (doesn't trigger re-renders)
  const codeRef = useRef(initialCode);
  
  // Debounced store update function
  const debouncedSetCode = useRef(
    debounce((code: string) => {
      setCode(code);
    }, 300)
  ).current;
  
  // Debounced onChange callback
  const debouncedOnChange = useRef(
    onChange ? debounce((code: string) => {
      onChange?.(code);
    }, 300) : undefined
  ).current;

  // Map language keys to CodeMirror language extensions
  const getLanguageExtension = useCallback((lang: LanguageKey): Extension => {
    switch (lang) {
      case 'python':
        return [python(), indentUnit.of("    ")]; // Use 4 spaces for Python
      case 'quickjs':
        return javascript();
      case 'clangpp':
        return cpp();
      default:
        return [python(), indentUnit.of("    ")];
    }
  }, []);

  // Create a custom highlight style using CSS variables
  const customHighlightStyle = HighlightStyle.define([
    { tag: tags.comment, color: 'var(--syntax-comment-color)' },
    { tag: tags.string, color: 'var(--syntax-string-color)' },
    { tag: tags.keyword, color: 'var(--syntax-keyword-color)' },
    { tag: tags.function(tags.variableName), color: 'var(--syntax-function-color)' },
    { tag: tags.number, color: 'var(--syntax-number-color)' },
    { tag: tags.bool, color: 'var(--syntax-boolean-color)' },
    { tag: tags.operator, color: 'var(--syntax-operator-color)' },
    { tag: tags.punctuation, color: 'var(--syntax-punctuation-color)' },
    { tag: tags.variableName, color: 'var(--syntax-text-color)' },
    { tag: tags.className, color: 'var(--syntax-function-color)' },
    { tag: tags.definition(tags.propertyName), color: 'var(--syntax-function-color)' },
    { tag: tags.propertyName, color: 'var(--syntax-function-color)' },
  ]);

  // Create a custom theme extension
  const customTheme = [
    EditorView.theme({
      "&": {
        height: "100%",
        maxHeight: "100%",
        overflow: "auto",
        backgroundColor: "var(--syntax-bg-color)",
        color: "var(--syntax-text-color)",
        fontFamily: "var(--syntax-font-family)",
        fontSize: "var(--syntax-font-size)",
        lineHeight: "var(--syntax-line-height)"
      },
      ".cm-scroller": {
        overflow: "auto",
        minHeight: "100%"
      },
      ".cm-content, .cm-gutter": {
        minHeight: "100%"
      },
      ".cm-content": {
        caretColor: "var(--syntax-text-color)"
      },
      ".cm-cursor": {
        borderLeftColor: "var(--syntax-text-color)"
      },
      ".cm-activeLine": {
        backgroundColor: "color-mix(in srgb, var(--syntax-bg-color) 80%, var(--syntax-text-color) 20%)"
      },
      ".cm-gutters": {
        backgroundColor: "var(--syntax-bg-color)",
        color: "var(--syntax-comment-color)",
        borderRight: "1px solid var(--syntax-border-color, var(--border))"
      },
      ".cm-activeLineGutter": {
        backgroundColor: "color-mix(in srgb, var(--syntax-bg-color) 70%, var(--syntax-text-color) 30%)"
      }
    }),
    syntaxHighlighting(customHighlightStyle)
  ];

  // Create an updateListener that uses debounced functions
  const createUpdateListener = useCallback(() => {
    return EditorView.updateListener.of(update => {
      if (update.docChanged) {
        const code = update.state.doc.toString();
        prevValueRef.current = code;
        codeRef.current = code;
        
        // Use debounced functions to update store and call onChange
        debouncedSetCode(code);
        if (debouncedOnChange) {
          debouncedOnChange(code);
        }
      }
    });
  }, [debouncedSetCode, debouncedOnChange]);

  // Create editor extensions
  const createEditorExtensions = useCallback((lang: LanguageKey) => {
    return [
      lineNumbers(),
      highlightActiveLine(),
      keymap.of(defaultKeymap),
      getLanguageExtension(lang),
      customTheme,
      createUpdateListener()
    ];
  }, [getLanguageExtension, createUpdateListener]);

  useEffect(() => {
    if (!editorRef.current) return;
    
    // Create the editor state
    const startState = EditorState.create({
      doc: initialCode,
      extensions: createEditorExtensions(language)
    });

    // Create the editor view
    const view = new EditorView({
      state: startState,
      parent: editorRef.current
    });
    
    viewRef.current = view;
    
    // Set initial code in the store (without debounce)
    setCode(initialCode);

    // Cleanup on unmount
    return () => {
      view.destroy();
    };
  }, []);  // Only run this effect once to prevent focus issues

  // If language changes, update the configuration
  useEffect(() => {
    if (viewRef.current) {
      const view = viewRef.current;
      const currentCode = view.state.doc.toString();
      
      view.setState(EditorState.create({
        doc: currentCode,
        extensions: createEditorExtensions(language)
      }));
    }
  }, [language, createEditorExtensions]);

  // Update editor content when the value prop changes
  useEffect(() => {
    if (viewRef.current && value !== undefined && value !== prevValueRef.current) {
      const view = viewRef.current;
      prevValueRef.current = value;
      
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value
        }
      });
    }
  }, [value]);

  return (
    <div 
      ref={editorRef} 
      className="border rounded-md overflow-hidden h-full w-full"
      style={{ 
        fontSize: '14px',
        display: 'flex',
        flexDirection: 'column'
      }}
    />
  );
}

export { CodeMirrorEditor }; 