import React from 'react';
import { useRunnoStore } from '@/stores/runno-store';
import { getProblemsArray } from '@/lib/problems';
import { Button } from '@/components/ui/button';

export function ProblemSelector() {
  const { setCurrentProblem, currentProblem, getProgressForProblem } = useRunnoStore();
  const problems = getProblemsArray();
  
  return (
    <div className="p-4 border-b flex flex-wrap gap-2">
      {problems.map(problem => {
        const progress = getProgressForProblem(problem.id);
        const isActive = currentProblem?.id === problem.id;
        
        return (
          <Button
            key={problem.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setCurrentProblem(problem)}
          >
            <span>{problem.title}</span>
            {progress?.solved && (
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            )}
          </Button>
        );
      })}
    </div>
  );
} 