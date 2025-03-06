/*
 * Component Architecture Explanation:
 * 
 * This component serves as a wrapper around the Runno runtime element,
 * providing a React-friendly interface. Key aspects:
 * 
 * 1. Dynamic Import: We import Runno dynamically to avoid SSR issues since Runno uses
 *    browser-specific APIs.
 * 
 * 2. DOM Manipulation: We programmatically create and append the Runno element rather than
 *    declaring it in JSX because custom elements don't work well with React's virtual DOM.
 * 
 * 3. Event Forwarding: We listen to Runno events and translate them to React state updates
 *    and store updates.
 * 
 * 4. Controlled Component: We make the editor a controlled component by syncing its state
 *    with our Zustand store.
 */

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayIcon, OctagonXIcon } from 'lucide-react';
import { useRunnoStore } from '@/stores/runno-store';
import { CodeMirrorEditor } from '@/components/ui/code-mirror-editor';
import { XtermTerminal } from '@/components/ui/xterm-terminal';
import { LanguageKey } from '@/lib/language-support';
import { headlessRunCode } from '@runno/runtime';

interface CodeEditorProps {
  defaultCode?: string;
  language?: LanguageKey;
  id: string;
}

export function CodeEditor({ defaultCode = '', language = 'python', id }: CodeEditorProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [userInput, setUserInput] = useState('');
  const { code } = useRunnoStore();
  
  // Handle running the code
  const handleRun = async () => {
    if (isRunning) {
      setIsRunning(false);
      setOutput(prev => prev + '\n[Program terminated]\n');
      return;
    }
    
    setIsRunning(true);
    setOutput(''); // Clear previous output
    
    try {
      // Use the headlessRunCode function directly instead of creating a RunElement
      const result = await headlessRunCode(language, code);
      
      // Process the result
      if (result.resultType === 'complete') {
        setOutput(result.stdout || result.tty);
      } else if (result.resultType === 'crash') {
        setOutput(`Error: ${result.error.message}`);
      } else {
        setOutput('Program was terminated');
      }
      
      setIsRunning(false);
    } catch (error) {
      setOutput(`Runtime error: ${error instanceof Error ? error.message : String(error)}`);
      setIsRunning(false);
    }
  };
  
  // Handle terminal input
  const handleTerminalInput = useCallback((input: string) => {
    setUserInput(input);
    // Here you would send this input to the running process
    // For now, we'll just echo it back
    setOutput(prev => prev + `\nYou entered: ${input}\n`);
  }, []);
  
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex justify-end mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRun}
            className={isRunning ? 'bg-red-100' : ''}
          >
            {isRunning ? (
              <>
                <OctagonXIcon className="mr-2 h-4 w-4" /> Stop
              </>
            ) : (
              <>
                <PlayIcon className="mr-2 h-4 w-4" /> Run
              </>
            )}
          </Button>
        </div>
        
        <CodeMirrorEditor 
          defaultCode={defaultCode}
          language={language}
        />
        
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Output</h4>
          <XtermTerminal 
            output={output}
            onInput={handleTerminalInput}
            isRunning={isRunning}
          />
        </div>
      </CardContent>
    </Card>
  );
}
