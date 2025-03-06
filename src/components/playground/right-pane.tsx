import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeMirrorEditor } from '@/components/ui/code-mirror-editor';
import { XTermTerminal } from '@/components/ui/xterm-terminal';
import { TestResults } from '@/components/ui/test-results';
import { ProgressTab } from '@/components/ui/progress-tab';
import { v4 as uuidv4 } from 'uuid';
import { useRunnoStore } from '@/stores/runno-store';
import { LanguageKey, supportedLanguages, getHeadlessExecutor } from '@/lib/language-support';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ChevronUp, ChevronDown } from 'lucide-react';

export function RightPane() {
  const { 
    code, 
    setCode, 
    activeLanguage, 
    setActiveLanguage, 
    testCases,
    addTestCase,
    setTestStatus,
    resetToStarterCode,
    updateProblemProgress,
    currentProblem
  } = useRunnoStore();
  
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isBottomPanelCollapsed, setIsBottomPanelCollapsed] = useState(false);

  // Run the code
  const runCode = async () => {
    console.log('runCode: Function called - setting isRunning true and clearing output');
    setIsRunning(true);
    setOutput(''); // Clear output first
    console.log('runCode: Output cleared, current output state:', output);
    
    try {
      console.log('runCode: Getting executor for language:', activeLanguage);
      const executor = getHeadlessExecutor(activeLanguage);
      console.log('runCode: Executing code, length:', code.length);
      const result = await executor(code);
      console.log('runCode: Execution complete, result type:', result.resultType);
      console.log('runCode: Result details:', {
        stdout: result.resultType === "complete" ? result.stdout : undefined,
        stderr: result.resultType === "complete" ? result.stderr : undefined,
        exitCode: result.resultType === "complete" ? result.exitCode : undefined,
        tty: result.resultType === "complete" && result.tty ? result.tty.substring(0, 100) : undefined
      });
      
      if (result.resultType === "complete") {
        // Set output in one operation to avoid multiple renders
        const finalOutput = result.stdout || result.stderr || '';
        console.log('runCode: Setting output to:', finalOutput);
        
        // Debug the state update
        setOutput(prevOutput => {
          console.log('runCode: State update callback, prevOutput:', prevOutput);
          console.log('runCode: State update callback, newOutput:', finalOutput);
          return finalOutput;
        });
        
        // Add a delayed check to see if the state actually updated
        setTimeout(() => {
          console.log('runCode: Delayed check - current output state:', output);
        }, 500);
      } else {
        console.log('runCode: Error - could not complete execution, setting error message');
        setOutput('Error: Could not complete execution');
      }
    } catch (error) {
      console.log('runCode: Exception caught:', error);
      setOutput(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      console.log('runCode: Finally block - setting isRunning to false');
      setIsRunning(false);
    }
  };

  // Run test cases with progress tracking
  const runTests = async () => {
    // Initialize test cases if none exist
    if (testCases.length === 0 && currentProblem?.testCases) {
      currentProblem.testCases.forEach(testCase => {
        addTestCase({
          id: uuidv4(),
          description: testCase.description,
          stdin: testCase.stdin || '',
          expectedOutput: testCase.expectedOutput || ''
        });
      });
    } else if (testCases.length === 0) {
      // Fallback if no test cases defined
      addTestCase({
        id: uuidv4(),
        description: 'Test case 1',
        stdin: '', 
        expectedOutput: ''
      });
    }
    
    // Use the enhanced checkCode function to run tests
    try {
      // Set all test cases to checking state
      testCases.forEach(testCase => {
        setTestStatus(testCase.id, 'checking');
      });
      
      // Import and use the checkCode function that handles test-specific inputs
      const { checkCode } = await import('@/lib/runno-headless');
      await checkCode(code);
      
      // Use setTimeout to ensure we check the updated state after React has processed all updates
      setTimeout(() => {
        // Get fresh state after all updates
        const currentTestCases = useRunnoStore.getState().testCases;
        const allPassed = currentTestCases.every(tc => tc.status === 'pass');
        
        // Update progress if all tests pass
        updateProblemProgress(allPassed);
      }, 0);
    } catch (error) {
      console.error("Error running tests:", error);
    }
  };

  return (
    <div className="bg-card rounded-lg shadow h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div className="space-x-2">
            <select
              value={activeLanguage}
              onChange={(e) => setActiveLanguage(e.target.value as LanguageKey)}
              className="px-2 py-1 border rounded"
            >
              {Object.entries(supportedLanguages).map(([key, lang]) => (
                <option key={key} value={key}>
                  {lang.name}
                </option>
              ))}
            </select>
            <Button
              onClick={resetToStarterCode}
              variant="outline"
              size="sm"
            >
              Reset Code
            </Button>
          </div>
          <div className="space-x-2">
            <Button
              onClick={runCode}
              variant="outline"
              size="sm"
              disabled={isRunning}
            >
              Run Code
            </Button>
            <Button
              onClick={runTests}
              variant="default"
              size="sm"
              disabled={isRunning}
            >
              Submit
            </Button>
          </div>
        </div>
      </div>

      <ResizablePanelGroup
        direction="vertical"
        className="flex-grow"
        onLayout={(sizes) => {
          localStorage.setItem('editor-layout', JSON.stringify(sizes));
        }}
      >
        <ResizablePanel 
          defaultSize={isBottomPanelCollapsed ? 95 : 70}
          className="min-h-[50px]"
        >
          <CodeMirrorEditor
            value={code}
            onChange={setCode}
            language={activeLanguage}
          />
        </ResizablePanel>
        
        <ResizableHandle 
          withHandle 
          className="group hover:bg-muted/30"
          onDoubleClick={() => setIsBottomPanelCollapsed(!isBottomPanelCollapsed)}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 z-10 bg-muted rounded-full p-1">
            {isBottomPanelCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </ResizableHandle>
        
        <ResizablePanel 
          defaultSize={isBottomPanelCollapsed ? 5 : 30}
          collapsible={true}
          collapsedSize={5}
          minSize={5}
          maxSize={50}
          onCollapse={() => setIsBottomPanelCollapsed(true)}
          onExpand={() => setIsBottomPanelCollapsed(false)}
          onResize={(size) => {
            if (size > 10) {
              setIsBottomPanelCollapsed(false);
            }
          }}
          className={
            isBottomPanelCollapsed 
              ? "min-h-[35px] max-h-[35px] transition-all duration-300 ease-in-out" 
              : "min-h-[100px]"
          }
        >
          <Tabs defaultValue="output" className="h-full flex flex-col">
            <TabsList className="w-full">
              <TabsTrigger value="output" className="flex-1">Output</TabsTrigger>
              <TabsTrigger value="testResults" className="flex-1">Test Results</TabsTrigger>
              <TabsTrigger value="progress" className="flex-1">Progress</TabsTrigger>
              <button 
                onClick={() => setIsBottomPanelCollapsed(!isBottomPanelCollapsed)}
                className="ml-auto px-2 focus:outline-none"
              >
                {isBottomPanelCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </TabsList>
            <div className={
              isBottomPanelCollapsed 
                ? "opacity-0 h-0 overflow-hidden transition-opacity duration-200 ease-out" 
                : "flex-grow overflow-auto opacity-100 transition-opacity duration-200 ease-in"
            }>
              <TabsContent value="output" className="h-full">
                <div className="h-full">
                  <XTermTerminal output={output} isRunning={isRunning} />
                </div>
              </TabsContent>
              <TabsContent value="testResults" className="p-4 h-full">
                <TestResults testCases={testCases} />
              </TabsContent>
              <TabsContent value="progress" className="h-full">
                <ProgressTab />
              </TabsContent>
            </div>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
} 