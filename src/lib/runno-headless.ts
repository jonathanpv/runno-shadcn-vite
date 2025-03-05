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
