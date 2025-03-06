import React from 'react';
import { useRunnoStore } from '@/stores/runno-store';
import { getProblemsArray } from '@/lib/problems';
import { format } from 'date-fns';
import { LanguageKey, supportedLanguages } from '@/lib/language-support';

export function ProgressTab() {
  const { userProgress, getCompletedProblemsCount } = useRunnoStore();
  const problems = getProblemsArray();
  const completedCount = getCompletedProblemsCount();
  const totalProblems = problems.length;
  
  // Calculate completion percentage
  const completionPercentage = totalProblems > 0 
    ? Math.round((completedCount / totalProblems) * 100) 
    : 0;
  
  // Get language names for display
  const getLanguageName = (key: LanguageKey): string => {
    return supportedLanguages[key]?.name || key;
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-card p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-2">Overall Progress</h3>
        <div className="flex items-center mb-2">
          <div className="flex-1 bg-muted rounded-full h-2.5 mr-2">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium">{completionPercentage}%</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {completedCount} of {totalProblems} problems solved
        </p>
      </div>
      
      <div className="bg-card p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Problem History</h3>
        {userProgress.length > 0 ? (
          <div className="divide-y">
            {userProgress.map(progress => {
              const problem = problems.find(p => p.id === progress.problemId);
              if (!problem) return null;
              
              return (
                <div key={progress.problemId} className="py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium flex items-center">
                        {problem.title}
                        {progress.solved && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-800">
                            Solved
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Last attempt: {format(new Date(progress.lastAttempted), 'PPP')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-md ${
                      problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                    </span>
                  </div>
                  
                  {/* Language submissions */}
                  <div className="mt-2">
                    <h5 className="text-xs font-medium mb-1 text-muted-foreground">Submissions:</h5>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(progress.languages).map(([lang, data]) => (
                        <div 
                          key={lang} 
                          className={`text-xs px-2 py-1 rounded ${
                            data.passed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {getLanguageName(lang as LanguageKey)}
                          {data.passed && ' ✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No problem attempts yet. Try solving some problems!
          </p>
        )}
      </div>
    </div>
  );
} 