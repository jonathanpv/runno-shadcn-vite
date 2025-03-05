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

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayIcon, OctagonXIcon } from 'lucide-react';
import { useRunnoStore } from '@/stores/runno-store';

interface CodeEditorProps {
  defaultCode?: string;
  language?: string;
  id: string;
}

export function CodeEditor({ defaultCode = '', language = 'python', id }: CodeEditorProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<any>(null);
  const { setCode } = useRunnoStore();
  
  useEffect(() => {
    // Import Runno runtime dynamically to avoid SSR issues
    import('@runno/runtime').then(({ RunElement }) => {
      if (!editorRef.current) return;
      
      // Create a new Runno element
      const runElement = document.createElement('runno-run') as HTMLElement & InstanceType<typeof RunElement>;
      runElement.setAttribute('runtime', language);
      runElement.setAttribute('editor', '');
      runElement.style.height = '400px';
      runElement.style.width = '100%';
      
      // Set the initial code
      runElement.innerHTML = defaultCode;
      
      // Save a reference for later use
      runtimeRef.current = runElement;
      
      // Append to the DOM
      editorRef.current.appendChild(runElement);
      
      // Listen for changes and update the store
      runElement.addEventListener('change', async () => {
        const code = await runElement.getEditorProgram();
        setCode(code);
      });
      
      // Listen for output
      runElement.addEventListener('output', (event: any) => {
        setOutput(event.detail.output);
      });
      
      // Listen for run state changes
      runElement.addEventListener('run', () => setIsRunning(true));
      runElement.addEventListener('stop', () => setIsRunning(false));
      
      // Initialize the store with the default code
      setCode(defaultCode);
    });
    
    // Cleanup on unmount
    return () => {
      if (editorRef.current && runtimeRef.current) {
        editorRef.current.removeChild(runtimeRef.current);
      }
    };
  }, [defaultCode, language, setCode]);
  
  const handleRun = () => {
    if (runtimeRef.current) {
      if (isRunning) {
        runtimeRef.current.stop();
      } else {
        runtimeRef.current.run();
      }
    }
  };
  
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
        
        <div ref={editorRef} className="border rounded-md overflow-hidden" />
        
        {output && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Output</h4>
            <pre className="bg-black text-white p-3 rounded-md text-sm overflow-x-auto">
              {output}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
