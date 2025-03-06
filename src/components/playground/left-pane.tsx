import { ProblemState } from '@/stores/runno-store';
import ProblemMarkdown from '@/components/ui/problem-markdown';

interface LeftPaneProps {
  problem?: ProblemState;
}

export function LeftPane({ problem }: LeftPaneProps) {
  return (
    <div className="bg-card rounded-lg p-4 overflow-auto h-full w-full">
      {problem ? (
        <ProblemMarkdown markdown={problem.description} />
      ) : (
        <p>Loading problem...</p>
      )}
    </div>
  );
} 