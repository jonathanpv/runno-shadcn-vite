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
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

interface TestCaseProps {
  id: string;
  description: string;
}

export function TestCase({ id, description }: TestCaseProps) {
  const { testCases } = useRunnoStore();
  const testCase = testCases.find(tc => tc.id === id);
  const [isOpen, setIsOpen] = useState(false);
  
  if (!testCase) return null;
  
  // Render different badge based on status
  const renderStatus = () => {
    switch (testCase.status) {
      case 'pass':
        return <Badge variant="outline" className="bg-green-100 text-green-800 text-xs font-normal py-0 h-5">Pass</Badge>;
      case 'fail':
        return <Badge variant="outline" className="bg-red-100 text-red-800 text-xs font-normal py-0 h-5">Fail</Badge>;
      case 'checking':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs font-normal py-0 h-5">Checking...</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted text-muted-foreground text-xs font-normal py-0 h-5">Not checked</Badge>;
    }
  };
  
  // Render feedback if available
  const renderFeedback = () => {
    if (!testCase.feedback) return null;
    
    return (
      <div className=" bg-card  rounded-sm">
        <p className="text-xs mb-1 text-foreground">{testCase.feedback.message}</p>
        
        {testCase.feedback.error && (
          <pre className="text-xs bg-background text-foreground p-1.5 rounded-sm overflow-x-auto border border-border">
            {testCase.feedback.error}
          </pre>
        )}
        
        {testCase.feedback.expected && testCase.feedback.received && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-xs font-medium mb-1 text-muted-foreground">Expected</p>
              <pre className="text-xs bg-background text-foreground p-1.5 rounded-sm overflow-x-auto border border-border h-20">
                {testCase.feedback.expected}
              </pre>
            </div>
            <div>
              <p className="text-xs font-medium mb-1 text-muted-foreground">Received</p>
              <pre className="text-xs bg-background text-foreground p-1.5 rounded-sm overflow-x-auto border border-border h-20">
                {testCase.feedback.received}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="rounded-sm hover:bg-muted/20 p-1.5 shadow-sm border border-primary/30 bg-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CardHeader className="p-1.5 pb-1 flex flex-row justify-between items-center">
          <CollapsibleTrigger className="flex flex-1 items-center justify-between ">
            <CardTitle className="text-xs font-medium text-foreground">{description}</CardTitle>
            <div className="flex items-center gap-1.5">
              {renderStatus()}
              {isOpen ? (
                <ChevronUpIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronDownIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <div className="border-t border-border/30 mx-1.5"></div>
          <CardContent className="p-1.5 pt-1.5">
            {testCase.stdin && (
              <div className="mb-1.5">
                <p className="text-xs font-medium mb-0.5 text-muted-foreground">Input</p>
                <pre className="text-xs bg-muted/30 p-1.5 rounded-sm">{testCase.stdin}</pre>
              </div>
            )}
            {testCase.expectedOutput && (
              <div>
                <p className="text-xs font-medium mb-0.5 text-muted-foreground">Expected Output</p>
                <pre className="text-xs bg-muted/30 p-1.5 rounded-sm">{testCase.expectedOutput}</pre>
              </div>
            )}
            {renderFeedback()}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
