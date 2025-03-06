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

import { useEffect } from 'react';
import { CodeEditor } from '@/components/ui/code-editor';
import { TestResults } from '@/components/ui/test-results';
import { Container } from '@/components/ui/container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supportedLanguages, LanguageKey } from '@/lib/language-support';
import { useRunnoStore } from '@/stores/runno-store';
import { v4 as uuidv4 } from 'uuid';

export default function CodePlayground() {
  const { addTestCase, setActiveLanguage } = useRunnoStore();
  
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
  
  // Handle language change
  const handleLanguageChange = (value: string) => {
    setActiveLanguage(value as LanguageKey);
  };
  
  return (
    <Container>
      <div className="py-8">
        <h1 className="text-2xl font-bold mb-6">Interactive Code Playground</h1>
        
        <Tabs defaultValue="python" onValueChange={handleLanguageChange}>
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
