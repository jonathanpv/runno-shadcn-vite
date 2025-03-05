// This store serves as a centralized state management system for our Runno integration
// It allows components to react to changes in code, test cases, and results
// without having to pass props through multiple levels

import { create } from 'zustand';
import { CompleteResult } from '@runno/runtime';

// Define the types for our store
type Status = 'none' | 'checking' | 'pass' | 'fail';

type TestCase = {
  id: string;
  description: string;
  stdin?: string;
  expectedOutput?: string;
  status: Status;
  feedback?: {
    message: string;
    error?: string;
    expected?: string;
    received?: string;
  };
};

interface RunnoState {
  code: string;
  testCases: TestCase[];
  results: Record<string, CompleteResult>;
  setCode: (code: string) => void;
  addTestCase: (testCase: Omit<TestCase, 'status'>) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
  setTestStatus: (id: string, status: Status, feedback?: TestCase['feedback']) => void;
  setResults: (id: string, result: CompleteResult) => void;
}

// Create the store
export const useRunnoStore = create<RunnoState>((set: (fn: (state: RunnoState) => Partial<RunnoState>) => void) => ({
  code: '',
  testCases: [],
  results: {},
  
  setCode: (code: string) => set((state: RunnoState) => ({
    code
  })),
  
  addTestCase: (testCase: Omit<TestCase, 'status'>) => set((state: RunnoState) => ({
    testCases: [...state.testCases, { ...testCase, status: 'none' }]
  })),
  
  updateTestCase: (id: string, updates: Partial<TestCase>) => set((state: RunnoState) => ({
    testCases: state.testCases.map((tc: TestCase) => 
      tc.id === id ? { ...tc, ...updates } : tc
    )
  })),
  
  setTestStatus: (id: string, status: Status, feedback?: TestCase['feedback']) => set((state: RunnoState) => ({
    testCases: state.testCases.map((tc: TestCase) => 
      tc.id === id ? { ...tc, status, feedback } : tc
    )
  })),
  
  setResults: (id: string, result: CompleteResult) => set((state: RunnoState) => ({
    results: { ...state.results, [id]: result }
  }))
}));