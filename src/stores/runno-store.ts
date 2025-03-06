// This store serves as a centralized state management system for our Runno integration
// It allows components to react to changes in code, test cases, and results
// without having to pass props through multiple levels

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CompleteResult } from '@runno/runtime';
import { LanguageKey } from '@/lib/language-support';
import { v4 as uuidv4 } from 'uuid';

// Define the types for our store
type TestStatus = 'idle' | 'checking' | 'pass' | 'fail';

interface TestFeedback {
  message: string;
  error?: string;
  expected?: string;
  received?: string;
}

export interface TestCaseState {
  id: string;
  description: string;
  stdin?: string;
  expectedOutput?: string;
  status: TestStatus;
  feedback?: TestFeedback;
  result?: CompleteResult;
}

// Add template for creating test cases
export interface TestCaseTemplate {
  description: string;
  stdin?: string;
  expectedOutput?: string;
}

// Problem state interface
export interface ProblemState {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  starterCode: Record<LanguageKey, string>;
  testCases?: TestCaseTemplate[];
}

// User progress interface to track completion
export interface UserProblemProgress {
  problemId: string;
  solved: boolean;
  lastAttempted: string; // ISO date string
  languages: {
    [key in LanguageKey]?: {
      code: string;
      passed: boolean;
      lastAttempted: string; // ISO date string
    };
  };
}

interface RunnoStore {
  // Code state
  code: string;
  activeLanguage: LanguageKey;
  
  // Test cases
  testCases: TestCaseState[];
  
  // Problem state
  currentProblem?: ProblemState;
  
  // User progress
  userProgress: UserProblemProgress[];
  
  // Actions
  setCode: (code: string) => void;
  setActiveLanguage: (language: LanguageKey) => void;
  addTestCase: (testCase: Omit<TestCaseState, 'status'>) => void;
  setTestStatus: (id: string, status: TestStatus, feedback?: TestFeedback) => void;
  setResults: (id: string, result: CompleteResult) => void;
  
  // Problem-related actions
  setCurrentProblem: (problem: ProblemState) => void;
  resetToStarterCode: () => void;
  
  // Progress-related actions
  updateProblemProgress: (passed: boolean) => void;
  getProgressForProblem: (problemId: string) => UserProblemProgress | undefined;
  getCompletedProblemsCount: () => number;
  loadUserCode: (problemId: string, language: LanguageKey) => string | undefined;
}

// Create the store with persistence
export const useRunnoStore = create<RunnoStore>()(
  persist(
    (set, get) => ({
      // Initial state
      code: '',
      activeLanguage: 'python',
      testCases: [],
      userProgress: [],
      
      // Actions
      setCode: (code) => set({ code }),
      
      setActiveLanguage: (activeLanguage) => set(state => {
        // When changing language, try to load saved code for current problem
        const { currentProblem } = state;
        if (currentProblem) {
          const savedCode = get().loadUserCode(currentProblem.id, activeLanguage);
          return { 
            activeLanguage,
            code: savedCode || currentProblem.starterCode[activeLanguage] || ''
          };
        }
        return { activeLanguage };
      }),
      
      addTestCase: (testCase) => set((state) => ({
        testCases: [
          ...state.testCases,
          {
            ...testCase,
            status: 'idle'
          }
        ]
      })),
      
      setTestStatus: (id, status, feedback) => set((state) => ({
        testCases: state.testCases.map((tc) => 
          tc.id === id ? { ...tc, status, feedback } : tc
        )
      })),
      
      setResults: (id, result) => set((state) => ({
        testCases: state.testCases.map((tc) => 
          tc.id === id ? { ...tc, result } : tc
        )
      })),
      
      // Problem-related actions
      setCurrentProblem: (problem) => set((state) => {
        // Create test cases from the problem definition
        const testCases: TestCaseState[] = problem.testCases 
          ? problem.testCases.map(tc => ({
              ...tc,
              id: uuidv4(),
              status: 'idle'
            }))
          : [];
        
        // Try to load saved code for this problem and language
        const activeLanguage = state.activeLanguage;
        const savedCode = get().loadUserCode(problem.id, activeLanguage);
        
        return {
          currentProblem: problem,
          testCases,
          code: savedCode || problem.starterCode[activeLanguage] || ''
        };
      }),
      
      resetToStarterCode: () => set((state) => {
        const { currentProblem, activeLanguage } = state;
        if (!currentProblem) return {};
        
        return {
          code: currentProblem.starterCode[activeLanguage] || ''
        };
      }),
      
      // Progress-related actions
      updateProblemProgress: (passed) => set((state) => {
        const { currentProblem, activeLanguage, code, userProgress } = state;
        if (!currentProblem) return { userProgress };
        
        const now = new Date().toISOString();
        const problemId = currentProblem.id;
        
        // Find existing progress or create new
        const existingProgressIndex = userProgress.findIndex(p => p.problemId === problemId);
        let newProgress = [...userProgress];
        
        if (existingProgressIndex >= 0) {
          // Update existing progress
          const oldProgress = newProgress[existingProgressIndex];
          newProgress[existingProgressIndex] = {
            ...oldProgress,
            solved: oldProgress.solved || passed,
            lastAttempted: now,
            languages: {
              ...oldProgress.languages,
              [activeLanguage]: {
                code,
                passed: passed,
                lastAttempted: now
              }
            }
          };
        } else {
          // Create new progress
          newProgress.push({
            problemId,
            solved: passed,
            lastAttempted: now,
            languages: {
              [activeLanguage]: {
                code,
                passed,
                lastAttempted: now
              }
            }
          });
        }
        
        return { userProgress: newProgress };
      }),
      
      getProgressForProblem: (problemId) => {
        return get().userProgress.find(p => p.problemId === problemId);
      },
      
      getCompletedProblemsCount: () => {
        return get().userProgress.filter(p => p.solved).length;
      },
      
      loadUserCode: (problemId, language) => {
        const progress = get().getProgressForProblem(problemId);
        return progress?.languages[language]?.code;
      }
    }),
    {
      name: 'coding-problems-progress',
      storage: createJSONStorage(() => localStorage),
      // Only persist user progress to save space
      partialize: (state) => ({ 
        userProgress: state.userProgress 
      }),
    }
  )
);