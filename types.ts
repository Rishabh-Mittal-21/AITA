import type React from 'react';

export interface Persona {
  id: string;
  name: string;
  description: string;
  avatar: React.ComponentType<{ className?: string }>;
  prompt: string;
}

export interface ReviewChunk {
  line_reference: number;
  issue_type: 'logic' | 'performance' | 'style' | 'readability' | 'security' | 'best-practice' | 'other';
  explanation: string;
  suggested_fix: string;
}
