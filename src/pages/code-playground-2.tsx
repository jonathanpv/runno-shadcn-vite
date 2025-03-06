import { useEffect } from 'react';
import { useRunnoStore } from '@/stores/runno-store';
import { LeftPane } from '@/components/playground/left-pane';
import { RightPane } from '@/components/playground/right-pane';
import { ProblemSelector } from '@/components/ui/problem-selector';
import { getProblemById } from '@/lib/problems';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ModeToggle } from '@/components/mode-toggle';

// Example problem for testing
const exampleProblem = getProblemById('two-sum');

export default function CodePlayground2() {
  const { 
    currentProblem,
    setCurrentProblem,
  } = useRunnoStore();
  
  // Load first problem when the component mounts if none is selected
  useEffect(() => {
    if (!currentProblem) {
      const firstProblem = getProblemById('two-sum');
      if (firstProblem) {
        setCurrentProblem(firstProblem);
      }
    }
  }, [currentProblem, setCurrentProblem]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex w-full justify-between">
        <h1 className="text-2xl font-bold mb-4">
          {currentProblem?.title || 'Code Playground'}
          {currentProblem?.difficulty && (
            <span className={`ml-2 px-2 py-1 text-sm rounded-md ${
              currentProblem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              currentProblem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentProblem.difficulty.charAt(0).toUpperCase() + currentProblem.difficulty.slice(1)}
            </span>
          )}
        </h1>

        <ModeToggle></ModeToggle>
      </div>
      
      
      
      {/* Problem selector */}
      <ProblemSelector />

      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 rounded-lg border mt-4"
      >
        {/* Problem Description Panel */}
        <ResizablePanel defaultSize={40} minSize={25}>
          <LeftPane problem={currentProblem} />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Code Editor Panel */}
        <ResizablePanel defaultSize={60}>
          <RightPane />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
