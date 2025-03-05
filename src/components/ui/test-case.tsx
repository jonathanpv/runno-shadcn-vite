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

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
