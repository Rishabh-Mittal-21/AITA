import React, { useState, useEffect, useCallback, useRef } from 'react';
import Toolbar from './components/Toolbar';
import CodePanel from './components/CodePanel';
import ReviewPanel from './components/ReviewPanel';
import { getCodeReview } from './services/geminiService';
import type { Persona, CodeReview, ReviewChunk } from './types';
import { PERSONAS, DEFAULT_CODE, SUPPORTED_LANGUAGES } from './constants';

interface CodeHistory {
    code: string;
    resolvedChunkId: number;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const App: React.FC = () => {
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [persona, setPersona] = useState<Persona>(PERSONAS[0]);
  const [codeReview, setCodeReview] = useState<CodeReview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedLines, setHighlightedLines] = useState<{ start: number, end: number } | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [codeHistory, setCodeHistory] = useState<CodeHistory[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(SUPPORTED_LANGUAGES[0]);
  const analysisCancelled = useRef(false);


  useEffect(() => {
    const loadVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices(); // Initial load
    return () => {
        window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleReview = useCallback(async () => {
    analysisCancelled.current = false;
    setIsLoading(true);
    setError(null);
    setHighlightedLines(null);
    
    if(!codeReview) setCodeReview(null);
    else setCodeReview(cr => ({ summary: '', feedback: [] }));

    setCodeHistory([]);
    try {
      const badFeedback = codeReview?.feedback.filter(
        f => f.userFeedback === 'bad' && f.userFeedbackText
      ) || [];

      const apiResponse = await getCodeReview(code, persona, selectedLanguage, badFeedback);
      
      if(analysisCancelled.current) return;

      if (apiResponse.detected_language && selectedLanguage === 'Auto-detect') {
        const foundLang = SUPPORTED_LANGUAGES.find(l => l.toLowerCase() === apiResponse.detected_language?.toLowerCase());
        if (foundLang) {
          setSelectedLanguage(foundLang);
        }
      }

      const feedbackWithState: CodeReview = {
        ...apiResponse,
        feedback: apiResponse.feedback.map((chunk, index) => ({
          ...chunk,
          id: index,
          status: 'active',
        })),
      };
      setCodeReview(feedbackWithState);
    } catch (e) {
      if(analysisCancelled.current) return;
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      if(analysisCancelled.current) return;
      setIsLoading(false);
    }
  }, [code, persona, codeReview, selectedLanguage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if(!isLoading) handleReview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleReview, isLoading]);

  const handleHighlightLines = (start: number, end?: number) => {
    setHighlightedLines({ start, end: end || start });
  };
  
  const handleApplyFix = (chunkId: number, originalCode: string, fix: string) => {
    setCodeHistory(prev => [...prev, { code, resolvedChunkId: chunkId }]);

    setCode(currentCode => {
        const occurrences = (currentCode.match(new RegExp(escapeRegExp(originalCode), 'g')) || []).length;
        if (occurrences === 0) {
            setError(`Could not apply fix: The original code for this issue was not found. It may have been modified already.`);
            setCodeHistory(prev => prev.slice(0, -1));
            return currentCode;
        }
        if (occurrences > 1) {
             setError(`Could not apply fix automatically: The same code snippet appears multiple times in your file. Please apply the fix manually.`);
             setCodeHistory(prev => prev.slice(0, -1));
             return currentCode;
        }

        const baseIndentation = originalCode.match(/^\s*/)?.[0] || '';
        const fixLines = fix.split('\n').map(line => line.trim() === '' ? '' : baseIndentation + line);
        const indentedFix = fixLines.join('\n');
        
        const newCode = currentCode.replace(originalCode, indentedFix);
        return newCode;
    });

    setCodeReview(currentReview => {
        if (!currentReview) return null;
        const newFeedback = currentReview.feedback.map(chunk =>
            chunk.id === chunkId ? { ...chunk, status: 'resolved' as const } : chunk
        );
        return { ...currentReview, feedback: newFeedback };
    });
  };

  const handleMarkAsResolved = (chunkId: number) => {
      setCodeHistory(prev => [...prev, { code, resolvedChunkId: chunkId }]);
      setCodeReview(currentReview => {
        if (!currentReview) return null;
        const newFeedback = currentReview.feedback.map(chunk =>
            chunk.id === chunkId ? { ...chunk, status: 'resolved' as const } : chunk
        );
        return { ...currentReview, feedback: newFeedback };
    });
  };

  const handleUndo = () => {
      if (codeHistory.length === 0) return;

      const lastState = codeHistory[codeHistory.length - 1];
      
      setCode(lastState.code);

      setCodeReview(currentReview => {
          if (!currentReview) return null;
          const newFeedback = currentReview.feedback.map(chunk =>
              chunk.id === lastState.resolvedChunkId ? { ...chunk, status: 'active' as const } : chunk
          );
          return { ...currentReview, feedback: newFeedback };
      });

      setCodeHistory(prev => prev.slice(0, -1));
  };

  const handleStop = () => {
    analysisCancelled.current = true;
    setIsLoading(false);
    setError("Analysis cancelled by user.");
  };

  const handleFeedback = (chunkId: number, feedback: 'good' | 'bad') => {
    setCodeReview(currentReview => {
        if (!currentReview) return null;
        const newFeedback = currentReview.feedback.map(chunk =>
            chunk.id === chunkId ? { ...chunk, userFeedback: feedback } : chunk
        );
        return { ...currentReview, feedback: newFeedback };
    });
  };

  const handleFeedbackSubmit = (chunkId: number, text: string) => {
      setCodeReview(currentReview => {
          if (!currentReview) return null;
          const newFeedback = currentReview.feedback.map(chunk =>
              chunk.id === chunkId ? { ...chunk, userFeedbackText: text } : chunk
          );
          return { ...currentReview, feedback: newFeedback };
      });
  };


  const handleSpeak = () => {
    if (!('speechSynthesis' in window) || !codeReview) {
        alert("Sorry, your browser doesn't support text-to-speech or there is no review to speak.");
        return;
    }
    
    const activeFeedback = codeReview.feedback.filter(f => f.status === 'active');
    const textToSpeak = (chunk: ReviewChunk) => {
        const lineRef = chunk.line_end ? `on lines ${chunk.line_start} to ${chunk.line_end}` : `on line ${chunk.line_start}`;
        return `${lineRef}: ${chunk.explanation}`;
    };
    const fullText = activeFeedback.map(textToSpeak).join('. ');
    if (!fullText) return;

    const utterance = new SpeechSynthesisUtterance(fullText);
    
    let selectedVoice: SpeechSynthesisVoice | undefined;
    if (persona.id === 'professional') {
        selectedVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('David')) || voices.find(v => v.lang.startsWith('en'));
    } else if (persona.id === 'chill') {
        selectedVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Zira')) || voices.find(v => v.lang.startsWith('en'));
    } else if (persona.id === 'sarcastic') {
        selectedVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Mark')) || voices.find(v => v.lang.startsWith('en'));
        utterance.pitch = 0.8;
        utterance.rate = 0.95;
    }
    utterance.voice = selectedVoice || voices.find(v => v.lang.startsWith('en')) || null;
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-midnight">
      <Toolbar
        selectedPersona={persona}
        onPersonaChange={setPersona}
        onReview={handleReview}
        onSpeak={handleSpeak}
        onUndo={handleUndo}
        onStop={handleStop}
        canUndo={codeHistory.length > 0}
        isReviewing={isLoading}
        hasReview={!!codeReview && codeReview.feedback.some(f => f.status === 'active')}
      />
      <main className="flex flex-1 overflow-hidden">
        <CodePanel
          code={code}
          onCodeChange={setCode}
          highlightLines={highlightedLines}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
        />
        <ReviewPanel
          persona={persona}
          review={codeReview}
          isLoading={isLoading}
          error={error}
          onHighlightLines={handleHighlightLines}
          onApplyFix={handleApplyFix}
          onMarkAsResolved={handleMarkAsResolved}
          onFeedback={handleFeedback}
          onFeedbackSubmit={handleFeedbackSubmit}
        />
      </main>
    </div>
  );
};

export default App;