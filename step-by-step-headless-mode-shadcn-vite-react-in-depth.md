# Implementing Runno Headless Mode with React, Shadcn UI, and Vite

This comprehensive guide explains how to implement Runno's headless execution mode within a modern React application using Shadcn UI components and Vite. We'll cover not just how to implement the functionality, but also why things work the way they do, architectural decisions, and advanced customizations.

## 1. Project Setup with Vite and React

### 1.1. Vite and ShadCN already installed
I created a starter with vite and shadcn already, we dont need to worry about that 
### 1.2. Install Dependencies

```bash
# Install Runno dependencies
pnpm install @runno/runtime


# Additional utilities
pnpm install zustand # For state management
```
### 1.4. Configure Vite for Cross-Origin Isolation

Create `vite.config.ts`:

```typescript
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import type { ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import type { NextFunction } from 'connect'

// This plugin configures the necessary headers for cross-origin isolation
// which is required for SharedArrayBuffer used by Runno
const crossOriginPolicy = {
  name: "configure-server",
  configureServer(server: ViteDevServer) {
    server.middlewares.use((_req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      next();
    });
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), crossOriginPolicy],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})


```

## 2. Required Files Setup

### 2.1. Understanding the Python Package Files

Create the necessary Python package files:

```bash
mkdir -p public/package
```

Create `public/package/__init__.py`:

```python
def say_hello():
    print("Hello from package")
```

**Why `__init__.py` is needed:**

The `__init__.py` file serves multiple purposes in this context:

1. **Python Package Structure**: In Python, the `__init__.py` file tells the computer the directory its under is a **Python** **package**.  Without it, Python wouldn't recognize the directory as a package.

2. **Filesystem Simulation**: Internally, when Runno runs Python code headlessly, it creates a virtual filesystem. The tar.gz file with the `__init__.py` packages is extracted into this virtual filesystem, allowing Python's import system to work correctly.

3. **Allow us to use say_hello()**: When a package is imported, the `__init__.py` file is executed. In our case, it defines a `say_hello()` function that can be imported by user code.

4. **Later on we will test Runno can successfully import the say_hello() package**: For now just roll with it

Now create the tarball:

```bash
cd public
tar -czf python-package.tar.gz package/
cd ..
```



## 3. React State Management with Zustand

### Bugfix: The package runno doesn't have the exports include the types for now we can work around by doing this in tsconfig.app.json

Adding the runno runtime as node_modules thingy
```json
"paths": {
      "@/*": [
        "./src/*"
      ],
      "@runno/runtime": ["./node_modules/@runno/runtime"]
    },
```

```json
{ 
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ],
      "@runno/runtime": ["./node_modules/@runno/runtime"]
    },

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}

```


### 3.1. Create a Runno Store with Zustand

Create `src/stores/runno-store.ts`:

```typescript
// This store serves as a centralized state management system for our Runno integration
// It allows components to react to changes in code, test cases, and results
// without having to pass props through multiple levels

import { create } from 'zustand';
import { CompleteResult } from '@runno/runtime';

// Define the types for our store
type Status = 'none' | 'checking' | 'pass' | 'fail';

type TestCase = {
  id: string;
  description: string;
  stdin?: string;
  expectedOutput?: string;
  status: Status;
  feedback?: {
    message: string;
    error?: string;
    expected?: string;
    received?: string;
  };
};

interface RunnoState {
  code: string;
  testCases: TestCase[];
  results: Record<string, CompleteResult>;
  setCode: (code: string) => void;
  addTestCase: (testCase: Omit<TestCase, 'status'>) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  setTestStatus: (id: string, status: Status, feedback?: TestCase['feedback']) => void;
  setResults: (id: string, result: CompleteResult) => void;
}

// Create the store
export const useRunnoStore = create<RunnoState>((set: (fn: (state: RunnoState) => Partial<RunnoState>) => void) => ({
  code: '',
  testCases: [],
  results: {},
  
  setCode: (code: string) => set((state: RunnoState) => ({
    code
  })),
  
  addTestCase: (testCase: Omit<TestCase, 'status'>) => set((state: RunnoState) => ({
    testCases: [...state.testCases, { ...testCase, status: 'none' }]
  })),
  
  updateTestCase: (id: string, updates: Partial<TestCase>) => set((state: RunnoState) => ({
    testCases: state.testCases.map((tc: TestCase) => 
      tc.id === id ? { ...tc, ...updates } : tc
    )
  })),
  
  setTestStatus: (id: string, status: Status, feedback?: TestCase['feedback']) => set((state: RunnoState) => ({
    testCases: state.testCases.map((tc: TestCase) => 
      tc.id === id ? { ...tc, status, feedback } : tc
    )
  })),
  
  setResults: (id: string, result: CompleteResult) => set((state: RunnoState) => ({
    results: { ...state.results, [id]: result }
  }))
}));
```

**Why use Zustand over React Context:**

1. **Performance**: Zustand uses a subscription model that minimizes re-renders
2. **Simplicity**: Simpler API compared to React Context + useReducer
3. **Devtools Integration**: Works with Redux devtools for debugging
4. **Middleware Support**: Supports middleware for side effects, persistence, etc.

## 4. Core React Components

### 4.1. Create a Runno Code Editor Component

Create `src/components/ui/code-editor.tsx`:

```typescript
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

```

### 4.2. Create a Test Case Component

Create `src/components/ui/test-case.tsx`:

```typescript
import { Badge } from './badge';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { useRunnoStore } from '@/stores/runno-store';

interface TestCaseProps {
  id: string;
  description: string;
}

export function TestCase({ id, description }: TestCaseProps) {
  const { testCases } = useRunnoStore();
  const testCase = testCases.find(tc => tc.id === id);
  
  if (!testCase) return null;
  
  // Render different badge based on status
  const renderStatus = () => {
    switch (testCase.status) {
      case 'pass':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Pass</Badge>;
      case 'fail':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Fail</Badge>;
      case 'checking':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Checking...</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100">Not checked</Badge>;
    }
  };
  
  // Render feedback if available
  const renderFeedback = () => {
    if (!testCase.feedback) return null;
    
    return (
      <div className="mt-4 bg-gray-50 p-4 rounded-md">
        <p className="text-sm mb-2">{testCase.feedback.message}</p>
        
        {testCase.feedback.error && (
          <pre className="text-xs bg-black text-white p-2 rounded-md overflow-x-auto">
            {testCase.feedback.error}
          </pre>
        )}
        
        {testCase.feedback.expected && testCase.feedback.received && (
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <p className="text-xs font-medium mb-1">Expected</p>
              <pre className="text-xs bg-black text-white p-2 rounded-md overflow-x-auto">
                {testCase.feedback.expected}
              </pre>
            </div>
            <div>
              <p className="text-xs font-medium mb-1">Received</p>
              <pre className="text-xs bg-black text-white p-2 rounded-md overflow-x-auto">
                {testCase.feedback.received}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-base">{description}</CardTitle>
        {renderStatus()}
      </CardHeader>
      <CardContent>
        {testCase.stdin && (
          <div className="mb-2">
            <p className="text-sm font-medium mb-1">Input</p>
            <pre className="text-xs bg-gray-100 p-2 rounded-md">{testCase.stdin}</pre>
          </div>
        )}
        {testCase.expectedOutput && (
          <div>
            <p className="text-sm font-medium mb-1">Expected Output</p>
            <pre className="text-xs bg-gray-100 p-2 rounded-md">{testCase.expectedOutput}</pre>
          </div>
        )}
        {renderFeedback()}
      </CardContent>
    </Card>
  );
}

/*
 * Design Decision Explanation:
 * 
 * This component is responsible for displaying a single test case and its status.
 * We use the store to access the current state of the test case, which allows:
 * 
 * 1. Reactive Updates: The component automatically re-renders when the test status 
 *    changes in the store.
 * 
 * 2. Separation of Concerns: The component only needs to render the data and doesn't
 *    need to manage the state itself.
 * 
 * 3. Consistent UI: By using Shadcn UI components like Card and Badge, we maintain
 *    a consistent look and feel across the application.
 */
```

### 4.3. Create a Test Results Container

Create `src/components/test-results.tsx`:

```typescript
import { Button } from './ui/button';
import { TestCase } from './ui/test-case';
import { useRunnoStore } from '@/stores/runno-store';
import { CheckCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { checkCode } from '@/lib/runno-headless';

export function TestResults() {
  const { testCases, code } = useRunnoStore();
  const [isChecking, setIsChecking] = useState(false);
  
  const handleCheckAll = async () => {
    setIsChecking(true);
    try {
      await checkCode(code);
    } finally {
      setIsChecking(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Requirements</h3>
        <Button 
          onClick={handleCheckAll} 
          disabled={isChecking || !code.trim()}
          className="flex items-center"
        >
          <CheckCircleIcon className="mr-2 h-4 w-4" />
          {isChecking ? 'Checking...' : 'Check All'}
        </Button>
      </div>
      
      <div className="space-y-4">
        {testCases.map((tc) => (
          <TestCase 
            key={tc.id} 
            id={tc.id} 
            description={tc.description} 
          />
        ))}
      </div>
    </div>
  );
}

/*
 * Architectural Explanation:
 * 
 * This component acts as a container for all test cases and provides
 * a button to initiate the checking process. The actual checking logic
 * is delegated to the `checkCode` function from the `runno-headless` module.
 * 
 * This separation allows us to:
 * 
 * 1. Keep the UI component focused on rendering
 * 2. Move the complex headless checking logic to a dedicated module
 * 3. Make the checking process reusable in other parts of the application
 */
```

## 5. Headless Execution Implementation

### 5.1. Create Core Headless Execution Logic

Create `src/lib/runno-headless.ts`:

```typescript
/*
 * Implementation Details:
 * 
 * 1. DOM Manipulation: 
 *    We create a hidden Runno element dynamically to avoid affecting the UI.
 * 
 * 2. Sequential Processing: 
 *    We process test cases one by one to avoid race conditions and to make
 *    the results easier to track.
 * 
 * 3. Error Handling: 
 *    We handle different types of errors (crashes, terminations, runtime errors)
 *    and provide appropriate feedback.
 * 
 * 4. C++ Support: 
 *    C++ requires a two-step process - compilation and execution. We handle this
 *    with special flags to the Runno runtime.
 */

import { RunElement } from '@runno/runtime';
import { useRunnoStore } from '@/stores/runno-store';
import { CompleteResult } from '@runno/runtime';

/**
 * This function is responsible for running a program headlessly and evaluating the results.
 * It leverages Runno's headless execution capabilities to:
 * 1. Run code without a visible terminal
 * 2. Process input from test cases
 * 3. Compare output to expected results
 */
export async function checkCode(code: string): Promise<void> {
  // Get the store state and methods
  const { testCases, setTestStatus, setResults } = useRunnoStore.getState();
  
  // Create a hidden Runno element for headless execution
  const runElement = document.createElement('runno-run') as RunElement;
  runElement.style.display = 'none';
  document.body.appendChild(runElement);
  
  try {
    // Process each test case in sequence
    for (const testCase of testCases) {
      // Set test status to checking
      setTestStatus(testCase.id, 'checking');
      
      // Run the code headlessly
      const stdin = testCase.stdin ? testCase.stdin + '\n' : '';
      const result = await runElement.headlessRunCode("python", code, stdin);
      
      // Store the complete result
      setResults(testCase.id, result as CompleteResult);
      
      // Process the result
      if (result.resultType === "crash") {
        setTestStatus(testCase.id, 'fail', {
          message: "There was a system error running your program."
        });
        continue;
      } 
      
      if (result.resultType === "terminated") {
        setTestStatus(testCase.id, 'fail', {
          message: "Your program was terminated early."
        });
        continue;
      }
      
      if (result.resultType === "complete" && result.exitCode !== 0) {
        setTestStatus(testCase.id, 'fail', {
          message: "Your program had an error.",
          error: result.tty
        });
        continue;
      }
      
      // Check if output matches expected output
      if (!testCase.expectedOutput) {
        // No output check required
        setTestStatus(testCase.id, 'pass');
        continue;
      }
      
      // Compare the output
      if (result.resultType === "complete" && result.stdout.trim() === testCase.expectedOutput.trim()) {
        setTestStatus(testCase.id, 'pass');
      } else if (result.resultType === "complete") {
        setTestStatus(testCase.id, 'fail', {
          message: "Your output didn't match what we expected.",
          expected: testCase.expectedOutput,
          received: result.stdout
        });
      }
    }
  } finally {
    // Clean up
    document.body.removeChild(runElement);
  }
}

/**
 * This function adds support for C++ headless execution
 * C++ requires compilation before execution, making the process more complex
 */
export async function checkCppCode(code: string): Promise<void> {
  const { testCases, setTestStatus, setResults } = useRunnoStore.getState();
  
  const runElement = document.createElement('runno-run') as RunElement;
  runElement.style.display = 'none';
  document.body.appendChild(runElement);
  
  try {
    // First compile the C++ code
    const compileResult = await runElement.headlessRunCode("clangpp", 
      `//-compile\n${code}`, "");
      
    // Check if compilation succeeded
    if (compileResult.resultType === "complete" && compileResult.exitCode !== 0) {
      // Handle compilation error for all test cases
      for (const testCase of testCases) {
        setTestStatus(testCase.id, 'fail', {
          message: "Compilation failed.",
          error: compileResult.resultType === "complete" 
            ? (compileResult.stderr || compileResult.tty)
            : "Compilation process failed"
        });
      }
      return;
    }
    
    // Run each test with the compiled program
    for (const testCase of testCases) {
      setTestStatus(testCase.id, 'checking');
      
      const stdin = testCase.stdin ? testCase.stdin + '\n' : '';
      
      // In C++ mode, after compilation, we run with the //-run flag
      const result = await runElement.headlessRunCode("clangpp", 
        `//-run\n${code}`, stdin);
      
      setResults(testCase.id, result as CompleteResult);
      
      // Process result similar to Python
      if (result.resultType === "crash") {
        setTestStatus(testCase.id, 'fail', {
          message: "There was a system error running your program."
        });
        continue;
      } 
      
      if (result.resultType === "terminated") {
        setTestStatus(testCase.id, 'fail', {
          message: "Your program was terminated early."
        });
        continue;
      }
      
      if (result.resultType === "complete" && result.exitCode !== 0) {
        setTestStatus(testCase.id, 'fail', {
          message: "Your program had an error.",
          error: result.tty
        });
        continue;
      }
      
      // Check if output matches expected output
      if (!testCase.expectedOutput) {
        // No output check required
        setTestStatus(testCase.id, 'pass');
        continue;
      }
      
      // Compare the output
      if (result.resultType === "complete" && result.stdout.trim() === testCase.expectedOutput.trim()) {
        setTestStatus(testCase.id, 'pass');
      } else if (result.resultType === "complete") {
        setTestStatus(testCase.id, 'fail', {
          message: "Your output didn't match what we expected.",
          expected: testCase.expectedOutput,
          received: result.stdout
        });
      }
    }
  } finally {
    document.body.removeChild(runElement);
  }
}

```

### 5.2. Implement Support for Multiple Languages

Create `src/lib/language-support.ts`:

```typescript
  /*
   * Design Explanation:
   * 
   * This module encapsulates the language-specific details to allow the
   * main code to be language-agnostic. By centralizing language configurations:
   * 
   * 1. Adding new languages becomes easier - just add a new entry to the supportedLanguages object
   * 2. Language-specific behavior (like compilation) is handled consistently
   * 3. UI components can use language metadata without knowing the implementation details
   */

/**
 * This module handles language-specific configurations and behaviors
 */

// Define supported languages and their configurations
export const supportedLanguages = {
    python: {
      name: 'Python',
      extension: '.py',
      runtime: 'python',
      needsCompilation: false,
      defaultCode: 'print("Hello, world!")'
    },
    javascript: {
      name: 'JavaScript',
      extension: '.js',
      runtime: 'quickjs',
      needsCompilation: false,
      defaultCode: 'console.log("Hello, world!")'
    },
    cpp: {
      name: 'C++',
      extension: '.cpp',
      runtime: 'clangpp',
      needsCompilation: true,
      defaultCode: '#include <iostream>\n\nint main() {\n  std::cout << "Hello, world!" << std::endl;\n  return 0;\n}'
    }
  };
  
  export type LanguageKey = keyof typeof supportedLanguages;
  
  // Helper function to get language-specific headless execution function
  export function getHeadlessExecutor(language: LanguageKey) {
    const { needsCompilation } = supportedLanguages[language];
    
    return async (runElement: any, code: string, stdin: string) => {
      if (needsCompilation) {
        // For languages that need compilation (like C++)
        const compileResult = await runElement.headlessRunCode(
          language, 
          `//-compile\n${code}`, 
          ""
        );
        
        if (compileResult.exitCode !== 0) {
          return compileResult;
        }
        
        return runElement.headlessRunCode(
          language, 
          `//-run\n${code}`, 
          stdin
        );
      } else {
        // For interpreted languages
        return runElement.headlessRunCode(language, code, stdin);
      }
    };
  }

```

## 6. Main Application Component

### 6.1. Assemble the Main Page

Create `src/pages/code-playground.tsx`:

```tsx
import { useEffect } from 'react';
import { CodeEditor } from '@/components/ui/code-editor';
import { TestResults } from '@/components/test-results';
import { Container } from '@/components/ui/container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supportedLanguages, LanguageKey } from '@/lib/language-support';
import { useRunnoStore } from '@/stores/runno-store';
import { v4 as uuidv4 } from 'uuid';

export default function CodePlayground() {
  const { addTestCase } = useRunnoStore();
  
  // Initialize test cases when the component mounts
  useEffect(() => {
    // Test case 1: Basic execution
    addTestCase({
      id: uuidv4(),
      description: 'The program should run without errors',
      stdin: '',
    });
    
    // Test case 2: Input and output
    addTestCase({
      id: uuidv4(),
      description: 'The program should ask for age and respond appropriately',
      stdin: '14',
      expectedOutput: 'Hi there!\nHow old are you? Heya, twin!\nSee ya later!'
    });
    
    // Test case 3: Conditional logic
    addTestCase({
      id: uuidv4(),
      description: 'The program should handle different ages correctly',
      stdin: '25',
      expectedOutput: 'Hi there!\nHow old are you? See ya later!'
    });
  }, [addTestCase]);
  
  return (
    <Container>
      <div className="py-8">
        <h1 className="text-2xl font-bold mb-6">Interactive Code Playground</h1>
        
        <Tabs defaultValue="python">
          <TabsList>
            {Object.entries(supportedLanguages).map(([key, { name }]) => (
              <TabsTrigger key={key} value={key}>{name}</TabsTrigger>
            ))}
          </TabsList>
          
          {Object.keys(supportedLanguages).map((key) => (
            <TabsContent key={key} value={key}>
              <CodeEditor 
                id={`editor-${key}`}
                language={key as LanguageKey}
                defaultCode={supportedLanguages[key as LanguageKey].defaultCode}
              />
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="mt-8">
          <TestResults />
        </div>
      </div>
    </Container>
  );
}

/*
 * Overall Architecture Explanation:
 * 
 * This page brings together all the components to create a complete code playground:
 * 
 * 1. Code Editor: Allows users to write and run code interactively
 * 2. Test Results: Shows test cases and their status
 * 3. Language Tabs: Allows switching between different programming languages
 * 
 * The page is responsible for initializing the test cases and providing the
 * overall layout, while delegating specific functionality to specialized components.
 * 
 * This separation of concerns makes the code more maintainable and allows
 * for easier testing and refactoring.
 */
```

## 7. Python Filesystem Structure Explained

### 7.1. Why `__init__.py` is Important

The `__init__.py` file in our Python package structure isn't specific to Runno's headless mode, but it's essential for Python's module system.

```
public/
└── package/
    └── __init__.py
```

**Detailed Explanation:**

1. **Python Package Structure**: 
   In Python, the `__init__.py` file marks a directory as a Python package. When Python encounters an import statement, it looks for this file in the specified package's directory.

2. **Module Loading Mechanism**:
   When you import a module in Python, the interpreter:
   - Searches for the module in `sys.modules` (a cache of loaded modules)
   - If not found, looks for a built-in module with that name
   - If not found, searches for a file matching the module name in the directories listed in `sys.path`
   - If the module name contains dots (e.g., `package.module`), it treats the first part as a package name and looks for an `__init__.py` file

3. **Virtual Filesystem in Runno**:
   When Runno runs Python code, it creates a virtual filesystem. The tar.gz file is extracted into this filesystem, making the package available for import, just like in a regular Python environment.

4. **Testing Import Capabilities**:
   In educational contexts, it's often important to test whether students can correctly import and use external modules. The `__init__.py` file enables this testing scenario.

```python
# Example of importing from the package
from package import say_hello

say_hello()  # Outputs: Hello from package
```

## 8. C++ Support Implementation Details

### 8.1. Why C++ Support Requires Special Handling

C++ support in Runno is more complex than Python or JavaScript because:

1. **Compilation Step**: C++ is a compiled language, requiring code to be compiled before execution.
2. **WASM Integration**: The C++ compiler itself is compiled to WebAssembly and runs in the browser.
3. **Two-Phase Process**: Headless execution involves first compiling the code, then running the compiled binary.

### 8.2. Required WASM Files for C++ Support

For C++ support, you need:

1. **clang.wasm**: The C++ compiler compiled to WebAssembly
2. **cpp-runtime.wasm**: The runtime environment for executing C++ programs
3. **libcpp.wasm**: The C++ standard library

These files work together to:
- Compile C++ code to WASM within the browser
- Set up the necessary runtime environment for the compiled code
- Provide standard library functions that C++ programs need

### 8.3. C++ Headless Execution Process

1. **Compilation Phase**:
   ```typescript
   const compileResult = await runElement.headlessRunCode(
     "cpp", 
     `//-compile\n${code}`, 
     ""
   );
   ```
   The `//-compile` directive tells Runno to compile the code but not run it.

2. **Execution Phase** (if compilation succeeds):
   ```typescript
   const runResult = await runElement.headlessRunCode(
     "cpp", 
     `//-run\n${code}`, 
     stdin
   );
   ```
   The `//-run` directive tells Runno to run the previously compiled code.

3. **Result Processing**: Similar to Python, we process the execution result to determine if the test passed or failed.

## 9. Advanced Topics

### 9.1. Testing Edge Cases in Headless Mode

Create `src/lib/advanced-testing.ts` for more sophisticated test cases:

```typescript
import { useRunnoStore } from '@/stores/runno-store';
import { getHeadlessExecutor } from './language-support';

/**
 * Function to test if code handles timeouts properly
 * This shows how to implement more complex testing logic
 */
export async function testWithTimeout(code: string, language: string, timeoutMs = 5000): Promise<boolean> {
  const runElement = document.createElement('runno-run');
  runElement.style.display = 'none';
  document.body.appendChild(runElement);
  
  try {
    const executor = getHeadlessExecutor(language as any);
    
    // Create a promise that resolves when the execution completes
    const executionPromise = executor(runElement, code, '');
    
    // Create a timeout promise that rejects after timeoutMs
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Execution timed out')), timeoutMs);
    });
    
    // Race the execution against the timeout
    try {
      const result = await Promise.race([executionPromise, timeoutPromise]);
      return result.exitCode === 0;
    } catch (error) {
      // If we get here, the timeout promise rejected
      return false;
    }
  } finally {
    document.body.removeChild(runElement);
  }
}

/**
 * Function to test memory usage
 * This demonstrates how to implement resource-constraint testing
 */
export async function testMemoryUsage(code: string, language: string, maxMemoryMB = 100): Promise<boolean> {
  // This is a conceptual implementation - actual memory tracking would
  // require integration with the Runno runtime's internal memory tracking
  
  // In a real implementation, you would:
  // 1. Configure memory limits for the WebAssembly instance
  // 2. Monitor memory usage during execution
  // 3. Fail the test if memory usage exceeds the threshold
  
  return true; // Placeholder
}

/*
 * Advanced Testing Design:
 * 
 * These functions show how to implement more sophisticated testing scenarios
 * beyond simple input/output matching. Such tests are important for:
 * 
 * 1. Performance testing (execution time, memory usage)
 * 2. Robustness testing (handling edge cases, error conditions)
 * 3. Security testing (preventing infinite loops, excessive resource usage)
 * 
 * By implementing these as separate utility functions, we keep the core
 * headless execution logic clean while enabling advanced testing capabilities.
 */
```

### 9.2. Custom Test Matchers

Create `src/lib/test-matchers.ts`:

```typescript
/**
 * This module provides custom matchers for comparing program output
 * beyond simple string equality
 */

// Interface for output matchers
export interface OutputMatcher {
  match(actual: string, expected: string): boolean;
  description: string;
}

// Exact matcher (default)
export const exactMatcher: OutputMatcher = {
  match: (actual, expected) => actual.trim() === expected.trim(),
  description: 'exact match'
};

// Contains matcher
export const containsMatcher: OutputMatcher = {
  match: (actual, expected) => actual.includes(expected),
  description: 'contains'
};

// Regular expression matcher
export const regexMatcher: OutputMatcher = {
  match: (actual, expected) => {
    try {
      const regex = new RegExp(expected);
      return regex.test(actual);
    } catch (e) {
      console.error('Invalid regex pattern:', expected);
      return false;
    }
  },
  description: 'regex match'
};

// Whitespace-insensitive matcher
export const whitespaceInsensitiveMatcher: OutputMatcher = {
  match: (actual, expected) => {
    const normalizeString = (s: string) => 
      s.trim().replace(/\s+/g, ' ');
    return normalizeString(actual) === normalizeString(expected);
  },
  description: 'whitespace-insensitive match'
};

// Numeric matcher (for comparing numbers in output)
export const numericMatcher: OutputMatcher = {
  match: (actual, expected) => {
    const extractNumbers = (s: string) => {
      const matches = s.match(/-?\d+(\.\d+)?/g);
      return matches ? matches.map(Number) : [];
    };
    
    const actualNums = extractNumbers(actual);
    const expectedNums = extractNumbers(expected);
    
    if (actualNums.length !== expectedNums.length) return false;
    
    return actualNums.every((num, i) => 
      Math.abs(num - expectedNums[i]) < 1e-6);
  },
  description: 'numeric match'
};

/*
 * Custom Matcher Design:
 * 
 * These matchers provide flexibility in how we evaluate program output:
 * 
 * 1. Interface-based Design: All matchers implement the same interface,
 *    making them interchangeable.
 * 
 * 2. Specialized Matchers: Each matcher addresses a specific use case,
 *    from exact matching to numeric comparison.
 * 
 * 3. Educational Focus: These matchers are designed with education in mind,
 *    allowing instructors to be more flexible in how they evaluate student code.
 */
```

## Conclusion

This in-depth guide has covered the implementation of Runno's headless mode in a React application using Shadcn UI, with particular attention to:

1. How to build a modern React application that integrates with Runno
2. The role of Python's package system and `__init__.py` in headless execution
3. Implementation details for C++ support
4. Advanced testing capabilities and custom output matchers

The architecture follows React best practices with:
- Component-based design
- Separation of concerns
- State management via Zustand
- Custom hooks for functionality reuse

By following this guide, you'll have a solid foundation for building sophisticated code execution environments with automated testing capabilities.
