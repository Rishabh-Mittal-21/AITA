
import React from 'react';
import type { Persona, ReviewChunk } from '../types';

interface ReviewPanelProps {
  persona: Persona;
  feedback: ReviewChunk[];
  isLoading: boolean;
  error: string | null;
  onScrollToLine: (line: number) => void;
}

const ReviewPanel: React.FC<ReviewPanelProps> = ({ persona, feedback, isLoading, error, onScrollToLine }) => {
  const [showFix, setShowFix] = React.useState<Record<number, boolean>>({});

  const toggleShowFix = (index: number) => {
    setShowFix(prev => ({ ...prev, [index]: !prev[index] }));
  };
  
  const getIssueTypeColor = (issueType: ReviewChunk['issue_type']) => {
    switch(issueType) {
        case 'logic': return 'bg-red-500/20 text-red-300';
        case 'performance': return 'bg-yellow-500/20 text-yellow-300';
        case 'security': return 'bg-purple-500/20 text-purple-300';
        case 'style': return 'bg-blue-500/20 text-blue-300';
        case 'readability': return 'bg-green-500/20 text-green-300';
        default: return 'bg-gray-500/20 text-gray-300';
    }
  }

  return (
    <div className="w-1/2 flex flex-col bg-bunker border-l border-shark">
      <div className="p-2 border-b border-shark text-storm-gray">AI Review</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isLoading && <LoadingMessage persona={persona} />}
        {error && <ErrorMessage error={error} />}
        {!isLoading && !error && feedback.length === 0 && <WelcomeMessage />}

        {feedback.map((chunk, index) => (
          <div key={index} className="flex items-start gap-3">
            <persona.avatar className="w-8 h-8 flex-shrink-0 mt-1 text-storm-gray bg-shark rounded-full p-1" />
            <div className="flex-1 bg-shark p-3 rounded-lg rounded-tl-none">
              <div className="flex justify-between items-center mb-2">
                 <button
                    onClick={() => onScrollToLine(chunk.line_reference)}
                    className="text-xs font-bold text-science-blue hover:underline focus:outline-none"
                  >
                    Line {chunk.line_reference}
                  </button>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getIssueTypeColor(chunk.issue_type)}`}>
                    {chunk.issue_type}
                  </span>
              </div>
              <p className="text-sm text-loblolly whitespace-pre-wrap">{chunk.explanation}</p>
              {chunk.suggested_fix && chunk.suggested_fix !== 'N/A' && (
                <div className="mt-3">
                  <button
                    onClick={() => toggleShowFix(index)}
                    className="text-xs px-3 py-1 rounded-md bg-storm-gray/20 hover:bg-storm-gray/40 text-loblolly transition-colors"
                  >
                    {showFix[index] ? 'Hide' : 'Fix this for me'}
                  </button>
                  {showFix[index] && (
                    <pre className="mt-2 p-2 bg-midnight rounded-md overflow-x-auto">
                      <code className="text-xs text-green-300">{chunk.suggested_fix}</code>
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LoadingMessage: React.FC<{ persona: Persona }> = ({ persona }) => {
    const messages = {
        professional: "Analyzing code integrity with architectural precision...",
        chill: "Just grabbing a coffee while I look over your code, one sec...",
        sarcastic: "Let's see what masterpiece of confusion we have today..."
    };
    const message = messages[persona.id as keyof typeof messages] || "Analyzing...";
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-storm-gray">
            <div className="animate-pulse-fast">
                <persona.avatar className="w-16 h-16 mb-4" />
            </div>
            <p className="text-sm">{message}</p>
        </div>
    );
};

const ErrorMessage: React.FC<{ error: string }> = ({ error }) => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="bg-red-500/20 text-red-300 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Oops, something went wrong!</h3>
            <p className="text-xs">{error}</p>
        </div>
    </div>
);

const WelcomeMessage: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center text-storm-gray">
        <ReviewIcon className="w-16 h-16 mb-4" />
        <h2 className="text-lg font-bold text-white">Ready for Review</h2>
        <p className="text-sm max-w-xs">
            Paste your code on the left, choose a persona, and click "Review Code" to get started.
        </p>
    </div>
);

const ReviewIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
);


export default ReviewPanel;
