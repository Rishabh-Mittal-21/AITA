import React, { useMemo, useState } from 'react';
import type { Persona, ReviewChunk, CodeReview } from '../types';

interface ReviewPanelProps {
  persona: Persona;
  review: CodeReview | null;
  isLoading: boolean;
  error: string | null;
  onHighlightLines: (start: number, end?: number) => void;
  onApplyFix: (chunkId: number, originalCode: string, fix: string) => void;
  onMarkAsResolved: (chunkId: number) => void;
  onFeedback: (chunkId: number, feedback: 'good' | 'bad') => void;
  onFeedbackSubmit: (chunkId: number, text: string) => void;
}

const getIssueTypeColor = (issueType: ReviewChunk['issue_type']) => {
    switch(issueType) {
        case 'logic': return 'bg-red-500/20 text-red-300';
        case 'performance': return 'bg-yellow-500/20 text-yellow-300';
        case 'optimize': return 'bg-teal-500/20 text-teal-300';
        case 'security': return 'bg-purple-500/20 text-purple-300';
        case 'style': return 'bg-blue-500/20 text-blue-300';
        case 'readability': return 'bg-green-500/20 text-green-300';
        default: return 'bg-gray-500/20 text-gray-300';
    }
};

const SummaryStats: React.FC<{ summary: string, feedback: ReviewChunk[] }> = ({ summary, feedback }) => {
  const stats = useMemo(() => {
    return feedback.reduce((acc, chunk) => {
      const type = chunk.issue_type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [feedback]);

  if (!summary && Object.keys(stats).length === 0) return null;

  return (
    <div className="bg-shark p-4 rounded-lg mb-6 border border-storm-gray/20">
      <h3 className="font-bold text-white mb-2 text-base">Overall Assessment</h3>
      <p className="text-sm text-loblolly mb-4 whitespace-pre-wrap">{summary}</p>
      {Object.keys(stats).length > 0 && (
        <>
          <h4 className="font-bold text-white mb-3 text-sm">Active Issues</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats).map(([type, count]) => (
              <span key={type} className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${getIssueTypeColor(type as ReviewChunk['issue_type'])}`}>
                {type.replace('-', ' ')}: {count}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};


const ReviewPanel: React.FC<ReviewPanelProps> = ({ persona, review, isLoading, error, onHighlightLines, onApplyFix, onMarkAsResolved, onFeedback, onFeedbackSubmit }) => {
  const [showFix, setShowFix] = useState<Record<number, boolean>>({});
  const [feedbackInput, setFeedbackInput] = useState<Record<number, string>>({});
  const [showFeedbackInput, setShowFeedbackInput] = useState<Record<number, boolean>>({});

  const activeFeedback = useMemo(() => review?.feedback.filter(f => f.status === 'active') || [], [review]);
  const resolvedFeedback = useMemo(() => review?.feedback.filter(f => f.status === 'resolved') || [], [review]);
  const allIssuesResolved = !isLoading && review != null && activeFeedback.length === 0 && resolvedFeedback.length > 0;

  const toggleShowFix = (index: number) => {
    setShowFix(prev => ({ ...prev, [index]: !prev[index] }));
  };
  
  const handleApply = (chunk: ReviewChunk) => {
      onApplyFix(chunk.id, chunk.original_code, chunk.suggested_fix);
      toggleShowFix(chunk.id);
  };
  
  const handleThumbsDown = (chunkId: number) => {
    onFeedback(chunkId, 'bad');
    setShowFeedbackInput(prev => ({ ...prev, [chunkId]: true }));
  };
  
  const handleSubmitFeedback = (chunkId: number) => {
    if(feedbackInput[chunkId]?.trim()){
      onFeedbackSubmit(chunkId, feedbackInput[chunkId]);
    }
    setShowFeedbackInput(prev => ({ ...prev, [chunkId]: false }));
  };


  return (
    <div className="w-1/2 flex flex-col bg-bunker border-l border-shark">
      <div className="p-2 border-b border-shark text-storm-gray">AI Review</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isLoading && <LoadingMessage persona={persona} />}
        {error && <ErrorMessage error={error} />}
        {!isLoading && !error && !review && <WelcomeMessage />}
        {review && !allIssuesResolved && <SummaryStats summary={review.summary} feedback={activeFeedback} />}
        
        {allIssuesResolved && <CongratsMessage />}

        {activeFeedback.map((chunk) => (
          <div key={chunk.id} className="flex items-start gap-3">
            <persona.avatar className="w-8 h-8 flex-shrink-0 mt-1 text-storm-gray bg-shark rounded-full p-1" />
            <div className="flex-1 bg-shark p-3 rounded-lg rounded-tl-none">
              <div className="flex justify-between items-center mb-2">
                 <button
                    onClick={() => onHighlightLines(chunk.line_start, chunk.line_end)}
                    className="flex items-center gap-1.5 text-xs font-bold text-science-blue hover:underline focus:outline-none"
                  >
                    <LocationMarkerIcon />
                    {chunk.line_end ? `Lines ${chunk.line_start}-${chunk.line_end}` : `Line ${chunk.line_start}`}
                  </button>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${getIssueTypeColor(chunk.issue_type)}`}>
                    {chunk.issue_type}
                  </span>
              </div>
              <p className="text-sm text-loblolly whitespace-pre-wrap">{chunk.explanation}</p>
              
              <div className="mt-3 flex items-center gap-2">
                  {chunk.suggested_fix !== undefined && chunk.suggested_fix !== 'N/A' && (
                    <button
                      onClick={() => toggleShowFix(chunk.id)}
                      className="text-xs px-3 py-1 rounded-md bg-storm-gray/20 hover:bg-storm-gray/40 text-loblolly transition-colors"
                    >
                      {showFix[chunk.id] ? 'Hide Suggestion' : 'Show Suggestion'}
                    </button>
                  )}
                  <button onClick={() => onMarkAsResolved(chunk.id)} title="Mark as Resolved" className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-storm-gray/20 hover:bg-storm-gray/40 text-loblolly transition-colors">
                     <CheckCircleIcon className="w-3 h-3 text-green-400" />
                     Resolve
                  </button>
              </div>

              {showFix[chunk.id] && (
                <div className="mt-2 p-2 bg-midnight rounded-md">
                  {chunk.suggested_fix.trim() === '' ? (
                    <div className="text-center p-2">
                       <p className="text-sm text-yellow-300 mb-2">Suggestion: Delete this code.</p>
                       <button onClick={() => handleApply(chunk)} className="text-xs px-3 py-1 rounded-md bg-red-500/20 hover:bg-red-500/40 text-red-300">Delete Code</button>
                    </div>
                  ) : (
                    <>
                      <pre className="overflow-x-auto">
                        <code className="text-xs text-green-300">{chunk.suggested_fix}</code>
                      </pre>
                      <div className="mt-2 pt-2 border-t border-storm-gray/20 flex gap-2">
                        <button onClick={() => handleApply(chunk)} className="text-xs px-3 py-1 rounded-md bg-green-500/20 hover:bg-green-500/40 text-green-300">Apply Fix</button>
                        <button onClick={() => toggleShowFix(chunk.id)} className="text-xs px-3 py-1 rounded-md bg-red-500/20 hover:bg-red-500/40 text-red-300">Cancel</button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-storm-gray/20 flex items-center justify-end gap-3">
                  {chunk.userFeedback ? (
                     <div className="flex items-center gap-2 text-xs">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        <span className="text-storm-gray">Feedback submitted</span>
                     </div>
                  ) : (
                    <>
                        <span className="text-xs text-storm-gray">Was this helpful?</span>
                        <button onClick={() => onFeedback(chunk.id, 'good')} className="p-1 rounded-full hover:bg-storm-gray/20 text-storm-gray hover:text-green-400 transition-colors">
                            <ThumbsUpIcon />
                        </button>
                        <button onClick={() => handleThumbsDown(chunk.id)} className="p-1 rounded-full hover:bg-storm-gray/20 text-storm-gray hover:text-red-400 transition-colors">
                            <ThumbsDownIcon />
                        </button>
                    </>
                  )}
              </div>
              {showFeedbackInput[chunk.id] && !chunk.userFeedbackText && (
                <div className="mt-2 space-y-2">
                    <textarea
                        value={feedbackInput[chunk.id] || ''}
                        onChange={(e) => setFeedbackInput(prev => ({...prev, [chunk.id]: e.target.value}))}
                        placeholder="Why was this suggestion incorrect?"
                        className="w-full text-xs bg-midnight border border-storm-gray/50 rounded-md p-2 focus:ring-2 focus:ring-science-blue focus:outline-none resize-y"
                        rows={3}
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => handleSubmitFeedback(chunk.id)} className="text-xs px-3 py-1 rounded-md bg-science-blue hover:bg-blue-700 text-white">Submit</button>
                        <button onClick={() => setShowFeedbackInput(prev => ({...prev, [chunk.id]: false}))} className="text-xs px-3 py-1 rounded-md bg-storm-gray/20 hover:bg-storm-gray/40">Cancel</button>
                    </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {resolvedFeedback.length > 0 && (
          <>
            <div className="flex items-center gap-3 pt-4">
              <hr className="w-full border-t border-shark" />
              <h3 className="text-sm font-semibold text-storm-gray whitespace-nowrap">Resolved Issues</h3>
              <hr className="w-full border-t border-shark" />
            </div>
            {resolvedFeedback.map((chunk) => (
              <div key={chunk.id} className="flex items-start gap-3 opacity-60">
                <CheckCircleIcon className="w-8 h-8 flex-shrink-0 mt-1 text-green-500 bg-shark rounded-full p-1.5" />
                <div className="flex-1 bg-shark/50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-storm-gray line-through">
                      {chunk.line_end ? `Lines ${chunk.line_start}-${chunk.line_end}` : `Line ${chunk.line_start}`}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${getIssueTypeColor(chunk.issue_type)}`}>
                      {chunk.issue_type}
                    </span>
                  </div>
                  <p className="text-sm text-storm-gray italic">{chunk.explanation}</p>
                </div>
              </div>
            ))}
          </>
        )}
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

const CongratsMessage: React.FC = () => (
    <div className="bg-green-500/20 text-green-300 p-4 rounded-lg text-center flex flex-col items-center gap-2 mb-6">
        <CheckCircleIcon className="w-12 h-12" />
        <h3 className="font-bold text-lg">All Issues Resolved!</h3>
        <p className="text-sm">Great job cleaning up the code. It looks fantastic!</p>
    </div>
);


const ReviewIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
);

const LocationMarkerIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
);

const CheckCircleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const ThumbsUpIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333V17a1 1 0 001 1h6.364a1 1 0 00.943-.658l2.121-6.364A1 1 0 0015.428 10H13V4.5A1.5 1.5 0 0011.5 3h-1A1.5 1.5 0 009 4.5v5.833" />
    </svg>
);
const ThumbsDownIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667V3a1 1 0 00-1-1h-6.364a1 1 0 00-.943.658L3.572 9H6v5.5A1.5 1.5 0 007.5 16h1a1.5 1.5 0 001.5-1.5V9.667" />
    </svg>
);

export default ReviewPanel;