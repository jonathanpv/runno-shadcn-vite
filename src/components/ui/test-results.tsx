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

function TestResults() {
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

export { TestResults }