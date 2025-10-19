import React, { useState, useEffect, useCallback, useRef } from 'react';
import Toolbar from './components/Toolbar';
import CodePanel from './components/CodePanel';
import ReviewPanel from './components/ReviewPanel';
import { getCodeReview } from './services/geminiService';
import { getElevenLabsAudio } from './services/elevenLabsService';
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
  const [codeHistory, setCodeHistory] = useState<CodeHistory[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(SUPPORTED_LANGUAGES[0]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const analysisCancelled = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Effect to handle cleanup when the component truly unmounts
  useEffect(() => {
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      audioSourceRef.current?.stop();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
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

  const handleStopSpeaking = useCallback(() => {
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
    }
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const handleSpeak = useCallback(async () => {
    if (!codeReview) {
      alert("There is no review to speak.");
      return;
    }
    
    const activeFeedback = codeReview.feedback.filter(f => f.status === 'active');
    if (activeFeedback.length === 0) return;

    const textToSpeak = (chunk: ReviewChunk) => {
        const lineRef = chunk.line_end ? `on lines ${chunk.line_start} to ${chunk.line_end}` : `on line ${chunk.line_start}`;
        return `${chunk.issue_type} issue ${lineRef}: ${chunk.explanation}`;
    };
    const fullText = activeFeedback.map(textToSpeak).join('. ');
    
    handleStopSpeaking();

    if (!persona.elevenLabsVoiceId) {
        setError("The selected persona does not have a configured voice ID for ElevenLabs.");
        return;
    }

    try {
        setIsSpeaking(true);
        const audioData = await getElevenLabsAudio(fullText, persona.elevenLabsVoiceId);
        
        // Lazily initialize AudioContext or create a new one if it was closed.
        // This robustly handles React StrictMode's double-mount behavior.
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;

        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const audioBuffer = await ctx.decodeAudioData(audioData);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => {
            setIsSpeaking(false);
            audioSourceRef.current = null;
        };
        source.start(0);
        audioSourceRef.current = source;
    } catch (e) {
        if (e instanceof Error) setError(`Text-to-speech error: ${e.message}`);
        else setError('An unknown text-to-speech error occurred.');
        setIsSpeaking(false);
    }
  }, [codeReview, persona.elevenLabsVoiceId, handleStopSpeaking]);

  return (
    <div className="h-screen w-screen flex flex-col bg-midnight">
      <Toolbar
        selectedPersona={persona}
        onPersonaChange={setPersona}
        onReview={handleReview}
        onSpeak={handleSpeak}
        onUndo={handleUndo}
        onStop={handleStop}
        onStopSpeaking={handleStopSpeaking}
        canUndo={codeHistory.length > 0}
        isReviewing={isLoading}
        isSpeaking={isSpeaking}
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