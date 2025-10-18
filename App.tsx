
import React, { useState, useEffect, useCallback } from 'react';
import Toolbar from './components/Toolbar.tsx';
import CodePanel from './components/CodePanel.tsx';
import ReviewPanel from './components/ReviewPanel.tsx';
import { getCodeReview } from './services/geminiService.ts';
import type { Persona, ReviewChunk } from './types';
import { PERSONAS, DEFAULT_CODE } from './constants';

const App: React.FC = () => {
  const [code, setCode] = useState<string>(DEFAULT_CODE);
  const [persona, setPersona] = useState<Persona>(PERSONAS[0]);
  const [reviewFeedback, setReviewFeedback] = useState<ReviewChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

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
    setIsLoading(true);
    setError(null);
    setReviewFeedback([]);
    try {
      const feedback = await getCodeReview(code, persona);
      setReviewFeedback(feedback);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, persona]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleReview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleReview]);

  const handleScrollToLine = (line: number) => {
    setHighlightedLine(line);
    setTimeout(() => setHighlightedLine(null), 2000); // Highlight for 2 seconds
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
        alert("Sorry, your browser doesn't support text-to-speech.");
        return;
    }
    
    const fullText = reviewFeedback.map(f => `On line ${f.line_reference}: ${f.explanation}`).join('. ');
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
        isReviewing={isLoading}
        hasReview={reviewFeedback.length > 0}
      />
      <main className="flex flex-1 overflow-hidden">
        <CodePanel
          code={code}
          onCodeChange={setCode}
          highlightLine={highlightedLine}
          onScrollToLine={handleScrollToLine}
        />
        <ReviewPanel
          persona={persona}
          feedback={reviewFeedback}
          isLoading={isLoading}
          error={error}
          onScrollToLine={handleScrollToLine}
        />
      </main>
    </div>
  );
};

export default App;
