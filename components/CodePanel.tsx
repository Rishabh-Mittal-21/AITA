import React, { useRef, useEffect, useMemo } from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';

interface CodePanelProps {
  code: string;
  onCodeChange: (newCode: string) => void;
  highlightLines: { start: number, end: number } | null;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
}

const CodePanel: React.FC<CodePanelProps> = ({ code, onCodeChange, highlightLines, selectedLanguage, onLanguageChange }) => {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLPreElement>(null);

  const lines = useMemo(() => code.split('\n'), [code]);

  const handleScroll = () => {
    if (editorRef.current && displayRef.current && lineNumbersRef.current) {
        const { scrollTop, scrollLeft } = editorRef.current;
        displayRef.current.scrollTop = scrollTop;
        displayRef.current.scrollLeft = scrollLeft;
        lineNumbersRef.current.scrollTop = scrollTop;
    }
  };
  
  const getLineElement = (line: number): HTMLElement | null => {
      if (displayRef.current) {
          return displayRef.current.querySelector(`[data-line-number="${line}"]`);
      }
      return null;
  }
  
  useEffect(() => {
    if (highlightLines) {
      const el = getLineElement(highlightLines.start);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightLines]);


  return (
    <div className="flex-1 flex flex-col bg-bunker font-mono text-sm relative">
      <div className="flex items-center justify-between p-2 border-b border-shark text-storm-gray">
        <span>Code Editor</span>
        <div className="flex items-center gap-2">
          <span className="text-xs">Language:</span>
          <select
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="text-xs rounded-md bg-shark border border-storm-gray/50 focus:ring-2 focus:ring-science-blue focus:outline-none appearance-none px-2 py-1"
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
          <div ref={lineNumbersRef} className="text-right pr-4 text-storm-gray select-none p-2 font-mono text-sm leading-relaxed overflow-hidden">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <div className="relative flex-1 h-full">
            <textarea
              ref={editorRef}
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              onScroll={handleScroll}
              spellCheck="false"
              className="absolute inset-0 w-full h-full bg-transparent resize-none focus:outline-none p-2 font-mono text-sm leading-relaxed text-transparent caret-loblolly overflow-auto custom-scrollbar scrollbar-inset"
            />
            <pre
              ref={displayRef}
              className="absolute inset-0 w-full h-full p-2 font-mono text-sm leading-relaxed select-text pointer-events-none overflow-auto custom-scrollbar scrollbar-inset"
              aria-hidden="true"
           >
            <code>
                {lines.map((line, i) => {
                    const isHighlighted = highlightLines ? 
                        (i + 1 >= highlightLines.start && i + 1 <= highlightLines.end) : 
                        false;
                    
                    return (
                        <div 
                            key={i} 
                            data-line-number={i + 1}
                            className={`transition-colors duration-300 rounded ${isHighlighted ? 'bg-science-blue/20' : ''}`}
                        >
                          {line || ' '}
                        </div>
                    )
                })}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodePanel;