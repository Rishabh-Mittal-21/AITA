
import React, { useState, useRef, useEffect, useMemo } from 'react';

interface CodePanelProps {
  code: string;
  onCodeChange: (newCode: string) => void;
  highlightLine: number | null;
  onScrollToLine: (line: number) => void;
}

const CodePanel: React.FC<CodePanelProps> = ({ code, onCodeChange, highlightLine }) => {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(true);

  const lines = useMemo(() => code.split('\n'), [code]);

  const handleScroll = () => {
    if (lineNumbersRef.current && editorRef.current) {
      lineNumbersRef.current.scrollTop = editorRef.current.scrollTop;
    }
  };
  
  const getLineElement = (line: number): HTMLElement | null => {
      if (displayRef.current) {
          return displayRef.current.querySelector(`[data-line-number="${line}"]`);
      }
      return null;
  }
  
  useEffect(() => {
    if (highlightLine !== null) {
      const el = getLineElement(highlightLine);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightLine]);


  return (
    <div className="flex-1 flex flex-col bg-bunker font-mono text-sm relative">
      <div className="p-2 border-b border-shark text-storm-gray">
        Code Editor
      </div>
      <div className="flex flex-1 overflow-hidden p-2 relative">
          <div ref={lineNumbersRef} className="text-right pr-4 text-storm-gray select-none pt-2">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            ref={editorRef}
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            onScroll={handleScroll}
            spellCheck="false"
            className="flex-1 bg-transparent resize-none focus:outline-none p-2 absolute inset-0 pl-16 text-transparent caret-loblolly"
          />
          <pre
              ref={displayRef}
              className="flex-1 p-2 overflow-auto select-text pointer-events-none"
              aria-hidden="true"
           >
            <code>
                {lines.map((line, i) => (
                    <div 
                        key={i} 
                        data-line-number={i + 1}
                        className={`transition-colors duration-500 rounded ${highlightLine === i + 1 ? 'bg-science-blue/20' : ''}`}
                    >
                      {line || ' '}
                    </div>
                ))}
            </code>
          </pre>
      </div>
    </div>
  );
};

export default CodePanel;
