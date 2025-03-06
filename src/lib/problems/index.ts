import { ProblemState } from '@/stores/runno-store';
import { twoSumProblem } from './two-sum';
import { validParenthesesProblem } from './valid-parentheses';

// Define available problems - this acts as our "database" of problems
export const problems: Record<string, ProblemState> = {
  'two-sum': twoSumProblem,
  'valid-parentheses': validParenthesesProblem,
};

// Helper to get problems as an array for listing
export const getProblemsArray = (): ProblemState[] => {
  return Object.values(problems);
};

// Get a specific problem by ID
export const getProblemById = (id: string): ProblemState | undefined => {
  return problems[id];
}; 