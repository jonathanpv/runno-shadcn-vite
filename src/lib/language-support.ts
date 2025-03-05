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
