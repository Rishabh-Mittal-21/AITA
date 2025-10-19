import type React from 'react';

export interface Persona {
  id: string;
  name: string;
  description: string;
  avatar: React.ComponentType<{ className?: string }>;
  prompt: string;
}

export interface ReviewChunk {
  id: number;
  status: 'active' | 'resolved';
  line_start: number;
  line_end?: number;
  original_code: string;
  issue_type: 'logic' | 'performance' | 'style' | 'readability' | 'security' | 'best-practice' | 'other' | 'optimize';
  explanation: string;
  suggested_fix: string;
  userFeedback?: 'good' | 'bad';
  userFeedbackText?: string;
}

export interface CodeReview {
  summary: string;
  feedback: ReviewChunk[];
  detected_language?: string;
}
