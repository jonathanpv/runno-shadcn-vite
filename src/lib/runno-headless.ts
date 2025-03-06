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

import { headlessRunCode } from '@runno/runtime';
import { useRunnoStore } from '@/stores/runno-store';
import { CompleteResult } from '@runno/runtime';
import { getHeadlessExecutor } from '@/lib/language-support';

/**
 * This function is responsible for running a program headlessly and evaluating the results.
 * It uses the active language from the store for execution.
 */
export async function checkCode(code: string): Promise<void> {
  // Get the store state and methods
  const { testCases, activeLanguage, setTestStatus, setResults, currentProblem } = useRunnoStore.getState();
  
  try {
    // Get the appropriate executor for the current language
    const executor = getHeadlessExecutor(activeLanguage);
    
    // Process each test case in sequence
    for (const testCase of testCases) {
      // Set test status to checking
      setTestStatus(testCase.id, 'checking');
      
      // Prepare the code to run based on current problem and test case
      let codeToRun = code;
      
      // Modify the code for each test case if the problem requires it
      if (currentProblem) {
        const problemId = currentProblem.id;
        
        if (problemId === 'two-sum') {
          // Extract the test case input from the description
          const match = testCase.description.match(/nums = \[([\d,]+)\], target = (\d+)/);
          if (match) {
            const numsArray = match[1];
            const target = match[2];
            
            // Based on the language, prepare the code differently
            if (activeLanguage === 'python') {
              // Replace any existing print statement with the test-specific one
              codeToRun = code.replace(
                /print\(twoSum\(\[.*?\], \d+\)\)/g,
                `print(twoSum([${numsArray}], ${target}))`
              );
              
              // If no print statement exists, add one at the end
              if (!codeToRun.includes('print(twoSum(')) {
                codeToRun += `\n\nprint(twoSum([${numsArray}], ${target}))`;
              }
            } else if (activeLanguage === 'quickjs') {
              codeToRun = code.replace(
                /console\.log\(twoSum\(\[.*?\], \d+\)\)/g,
                `console.log(twoSum([${numsArray}], ${target}))`
              );
              
              if (!codeToRun.includes('console.log(twoSum(')) {
                codeToRun += `\n\nconsole.log(twoSum([${numsArray}], ${target}))`;
              }
            } else if (activeLanguage === 'clangpp') {
              // For C++, we'll need more complex regex to handle the vector initialization
              codeToRun = code.replace(
                /std::vector<int> nums = \{.*?\};[\s\S]*?int target = \d+;/g,
                `std::vector<int> nums = {${numsArray}};\n    int target = ${target};`
              );
            }
          }
        } else if (problemId === 'valid-parentheses') {
          // Extract test input from the description
          const match = testCase.description.match(/s = "([^"]+)"/);
          if (match) {
            const input = match[1];
            
            // Prepare language-specific code
            if (activeLanguage === 'python') {
              codeToRun = code.replace(
                /print\(isValid\(".*?"\)\)/g,
                `print(isValid("${input}"))`
              );
              
              if (!codeToRun.includes('print(isValid(')) {
                codeToRun += `\n\nprint(isValid("${input}"))`;
              }
            } else if (activeLanguage === 'quickjs') {
              codeToRun = code.replace(
                /console\.log\(isValid\(".*?"\)\)/g,
                `console.log(isValid("${input}"))`
              );
              
              if (!codeToRun.includes('console.log(isValid(')) {
                codeToRun += `\n\nconsole.log(isValid("${input}"))`;
              }
            } else if (activeLanguage === 'clangpp') {
              codeToRun = code.replace(
                /std::cout << \(isValid\(".*?"\)/g,
                `std::cout << (isValid("${input}")`
              );
            }
          }
        }
      }
      
      // Prepare stdin from test case
      const stdin = testCase.stdin ? testCase.stdin + '\n' : '';
      
      // Run the modified code
      const result = await executor(codeToRun, stdin);
      
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
  } catch (error) {
    console.error("Error running code:", error);
    // Handle any unexpected errors
    for (const testCase of testCases) {
      setTestStatus(testCase.id, 'fail', {
        message: "An unexpected error occurred while checking your code."
      });
    }
  }
}

/**
 * This function adds support for C++ headless execution
 * C++ requires compilation before execution, making the process more complex
 */
export async function checkCppCode(code: string): Promise<void> {
  const { testCases, setTestStatus, setResults } = useRunnoStore.getState();
  
  try {
    // First compile the C++ code
    const compileResult = await headlessRunCode("clangpp", `//-compile\n${code}`);
      
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
      const result = await headlessRunCode("clangpp", `//-run\n${code}`, stdin);
      
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
  } catch (error) {
    console.error("Error running C++ code:", error);
    // Handle any unexpected errors
    for (const testCase of testCases) {
      setTestStatus(testCase.id, 'fail', {
        message: "An unexpected error occurred while checking your code."
      });
    }
  }
}
