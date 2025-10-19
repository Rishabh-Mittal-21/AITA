import React from 'react';
import type { Persona } from './types';

// FIX: Rewrote icon components using React.createElement instead of JSX,
// as JSX syntax is not supported in .ts files. This resolves compilation errors.
const ProfessionalSeniorDevIcon: React.FC<{className?: string}> = ({ className }) => (
  React.createElement('svg', { className, viewBox: "0 0 24 24", fill: "currentColor", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement('path', { d: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" }),
    React.createElement('path', { d: "M16.5 12c1.38 0 2.5-1.12 2.5-2.5S17.88 7 16.5 7 14 8.12 14 9.5s1.12 2.5 2.5 2.5zm-9 0c1.38 0 2.5-1.12 2.5-2.5S8.88 7 7.5 7 5 8.12 5 9.5 6.12 12 7.5 12zm0 2C5.83 14 2 15.17 2 17v2h11v-2c0-1.83-3.83-3-5.5-3z" })
  )
);

const ChillBuddyIcon: React.FC<{className?: string}> = ({ className }) => (
  React.createElement('svg', { className, viewBox: "0 0 24 24", fill: "currentColor", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement('path', { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.5-4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-2.5-6C10.34 9.5 9 10.67 9 12h6c0-1.33-1.34-2.5-3.5-2.5z" })
  )
);

const SarcasticHackerIcon: React.FC<{className?: string}> = ({ className }) => (
  React.createElement('svg', { className, viewBox: "0 0 24 24", fill: "currentColor", xmlns: "http://www.w3.org/2000/svg" },
    React.createElement('path', { d: "M12 1.99c-5.52 0-10 4.48-10 10.01 0 5.52 4.48 10 10 10s10-4.48 10-10c0-5.53-4.48-10.01-10-10.01zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM8.5 10.5l-1 1 2.5 2.5 2.5-2.5-1-1-1.5 1.5-1.5-1.5zm7 0l-1.5-1.5-1.5 1.5-1-1 2.5-2.5 2.5 2.5-1 1zM12 14c-2.33 0-4.32 1.45-5.12 3.5h10.24c-.8-2.05-2.79-3.5-5.12-3.5z" })
  )
);


export const PERSONAS: Persona[] = [
  {
    id: 'professional',
    name: 'Professional Senior Dev',
    description: 'Formal, strict, and focused on best practices, code quality, and maintainability. Provides feedback like a seasoned architect.',
    // FIX: Added missing avatar property to satisfy the Persona type.
    avatar: ProfessionalSeniorDevIcon,
    prompt: `You are a professional senior software engineer with 20 years of experience. Your tone is formal, objective, and highly critical. You focus on design patterns, scalability, security, and adherence to SOLID principles. Your feedback is direct and assumes a high level of technical understanding. Also analyze the code comments for clarity and accuracy.`
  },
  {
    id: 'chill',
    name: 'Chill Buddy',
    description: 'Casual, encouraging, and friendly. Explains concepts in a simple, approachable way, like a helpful teammate.',
    // FIX: Added missing avatar property to satisfy the Persona type.
    avatar: ChillBuddyIcon,
    prompt: `You are a friendly and encouraging senior developer, acting like a helpful coding buddy. Your tone is casual, positive, and supportive. Use emojis (sparingly). For LOGIC errors, explain the problem in a simple, 'Explain Like I'm 5' style, breaking down the concept as if you're talking to a complete beginner. For other issues like style or syntax, a regular friendly explanation is fine. Your goal is to be super clear and remove any anxiety about making mistakes. Also, check if the comments are helpful and easy to understand.`
  },
  {
    id: 'sarcastic',
    name: 'Sarcastic Hacker',
    description: 'Witty, slightly roasty, but ultimately constructive. Uses humor and sarcasm to point out flaws, like a character from a cyberpunk movie.',
    // FIX: Added missing avatar property to satisfy the Persona type.
    avatar: SarcasticHackerIcon,
    prompt: `You are a brilliant but cynical and sarcastic hacker. Your tone is witty, dry, and full of backhanded compliments. You find flaws with a sense of amusement, but your underlying advice is sharp and technically sound. You might say things like "Did you even *try* to run this?" before giving a solid performance optimization tip. Also, check if the comments are even remotely useful or just stating the obvious.`
  }
];

export const SUPPORTED_LANGUAGES = ['Auto-detect', 'JavaScript', 'TypeScript', 'Python', 'Java', 'HTML', 'CSS', 'Go', 'Rust'];

export const DEFAULT_CODE = `
import React, { useState } from 'react';

// A simple counter component
function Counter() {
  var [count, setCount] = useState(0);

  // This function is not memoized, might cause re-renders
  const increment = () => {
    setCount(count + 1);
  };
  
  const decrement = () => {
    setCount(count - 1);
  };
  
  // Resets the counter to 0
  function reset() {
    setCount(0)
  }

  // Heavy computation inside render
  const isEven = () => {
    let i = 0;
    while(i < 1000000000) { i++; }
    return count % 2 == 0;
  };

  return (
    <div style={{padding: "20px", border: "1px solid #ccc"}}>
      <h1>Counter</h1>
      <p>Current count is: {count}</p>
      <p>Counter is {isEven() ? 'Even' : 'Odd'}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

export default Counter;
`;