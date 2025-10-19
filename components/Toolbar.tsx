import React from 'react';
import { PERSONAS } from '../constants';
import type { Persona } from '../types';

interface ToolbarProps {
  selectedPersona: Persona;
  onPersonaChange: (persona: Persona) => void;
  onReview: () => void;
  onSpeak: () => void;
  onUndo: () => void;
  onStop: () => void;
  onStopSpeaking: () => void;
  canUndo: boolean;
  isReviewing: boolean;
  isSpeaking: boolean;
  hasReview: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedPersona,
  onPersonaChange,
  onReview,
  onSpeak,
  onUndo,
  onStop,
  onStopSpeaking,
  canUndo,
  isReviewing,
  isSpeaking,
  hasReview
}) => {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const persona = PERSONAS.find(p => p.id === e.target.value);
    if (persona) {
      onPersonaChange(persona);
    }
  };

  return (
    <div className="border-b border-shark bg-bunker">
      <div className="flex items-center justify-between py-2 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">
            Git<span className="text-science-blue">Good</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <selectedPersona.avatar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-storm-gray" />
            <select
              value={selectedPersona.id}
              onChange={handleSelectChange}
              className="pl-10 pr-4 py-2 text-sm rounded-md bg-shark border border-storm-gray/50 focus:ring-2 focus:ring-science-blue focus:outline-none appearance-none"
            >
              {PERSONAS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
           {isSpeaking ? (
            <button
              onClick={onStopSpeaking}
              className="px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors bg-amber-600 hover:bg-amber-700 text-white"
            >
              <StopIcon />
              Stop Speaking
            </button>
           ) : (
            <button
              onClick={onSpeak}
              disabled={!hasReview || isReviewing}
              className="px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-shark hover:bg-storm-gray/20 border border-storm-gray/50"
            >
              <SpeakerIcon />
              Speak
            </button>
           )}
          <button
            onClick={onUndo}
            disabled={!canUndo || isReviewing}
            className="px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-shark hover:bg-storm-gray/20 border border-storm-gray/50"
          >
            <UndoIcon />
            Undo
          </button>
          {isReviewing ? (
             <button
              onClick={onStop}
              className="px-4 py-2 text-sm font-semibold text-white rounded-md flex items-center gap-2 transition-colors bg-red-600 hover:bg-red-700"
            >
              <SpinnerIcon />
              Stop
            </button>
          ) : (
            <button
              onClick={onReview}
              disabled={isReviewing}
              className="px-4 py-2 text-sm font-semibold text-white rounded-md flex items-center gap-2 transition-colors bg-science-blue hover:bg-blue-700 disabled:bg-blue-900 disabled:text-gray-400 disabled:cursor-wait"
            >
              <ReviewIcon />
              Review Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ReviewIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
);

const SpeakerIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M6 8a2 2 0 012-2h1.586l1.707-1.707A1 1 0 0113 5.414v9.172a1 1 0 01-1.707.707L9.586 14H8a2 2 0 01-2-2H3a1 1 0 01-1-1V9a1 1 0 011-1h3zm6 0a1 1 0 11-2 0 1 1 0 012 0zm3.5 4.5a1 1 0 10-2 0v-5a1 1 0 102 0v5z" />
    </svg>
);

const StopIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3z" clipRule="evenodd" />
    </svg>
);

const UndoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM5.293 8.293a1 1 0 011.414 0L9 10.586V7a1 1 0 112 0v3.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);


const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export default Toolbar;
