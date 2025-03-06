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

import { headlessRunCode } from '@runno/runtime';

// Define supported languages and their configurations
export const supportedLanguages = {
    python: {
      name: 'Python',
      extension: '.py',
      runtime: 'python',
      needsCompilation: false,
      defaultCode: 'print("Hello, world!")'
    },
    quickjs: {
      name: 'JavaScript',
      extension: '.js',
      runtime: 'quickjs',
      needsCompilation: false,
      defaultCode: 'console.log("Hello, world!")'
    },
    clangpp: {
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
    
    return async (code: string, stdin: string) => {
      if (needsCompilation) {
        // For languages that need compilation (like C++)
        const compileResult = await headlessRunCode(
          language, 
          `//-compile\n${code}`
        );
        
        if (compileResult.resultType === "complete" && compileResult.exitCode !== 0) {
          return compileResult;
        }
        
        return headlessRunCode(
          language, 
          `//-run\n${code}`
        );
      } else {
        // For interpreted languages
        const result = await headlessRunCode(language, code);
        
        // Fix for Python "None" issue - if we have a result object with stdout="None"
        // and the code contains print statements, we might need to fix the output
        if (language === 'python' && 
            result.resultType === 'complete' && 
            result.stdout === 'None' &&
            code.includes('print(')) {
          
          // Try running again with a wrapper that captures print output properly
          const wrappedCode = `
import sys
from io import StringIO

# Capture stdout
old_stdout = sys.stdout
sys.stdout = mystdout = StringIO()

# Run the user code
${code}

# Restore stdout and get the captured output
sys.stdout = old_stdout
print(mystdout.getvalue())
`;
          
          return headlessRunCode(language, wrappedCode);
        }
        
        return result;
      }
    };
  }
