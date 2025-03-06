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

import { Button } from '@/components/ui/button';
import { TestCase } from '@/components/ui/test-case';
import { useRunnoStore } from '@/stores/runno-store';
import { CheckCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { checkCode } from '@/lib/runno-headless';
import { TestCaseState } from '@/stores/runno-store';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface TestResultsProps {
  testCases: TestCaseState[];
}

function TestResults({ testCases }: TestResultsProps) {
  const { code } = useRunnoStore();
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
    <Card className="gap-2 bg-background border-border shadow-sm">
      <CardHeader className=" space-y-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-sm font-medium text-foreground">Requirements</h3>
            
            <Button 
              onClick={handleCheckAll} 
              disabled={isChecking || !code.trim()}
              variant="default"
              size="sm"
              className="h-7 bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-2"
            >
              <CheckCircleIcon className="mr-1 h-3 w-3" />
              {isChecking ? 'Checking...' : 'Check All'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="border-t border-primary"></div>
        {testCases.map((tc) => (
          <TestCase 
            key={tc.id} 
            id={tc.id} 
            description={tc.description} 
          />
        ))}
      </CardContent>
    </Card>
  );
}

export { TestResults };