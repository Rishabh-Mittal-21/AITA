import { GoogleGenAI, Type } from "@google/genai";
import type { Persona, ReviewChunk, CodeReview } from '../types';

// The return type from the API before we add client-side state
type ApiReviewChunk = Omit<ReviewChunk, 'id' | 'status' | 'userFeedback' | 'userFeedbackText'>;
type ApiCodeReview = { summary: string, feedback: ApiReviewChunk[], detected_language: string };


const getCodeReview = async (code: string, persona: Persona, language: string | null, previousBadFeedback?: ReviewChunk[]): Promise<ApiCodeReview> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let feedbackPrompt = '';
  if (previousBadFeedback && previousBadFeedback.length > 0) {
    const feedbackItems = previousBadFeedback
        .map(f => `
- Regarding this original code snippet:\n\`\`\`\n${f.original_code}\n\`\`\`\nYour suggestion "${f.suggested_fix}" was incorrect. The user provided this feedback: "${f.userFeedbackText}"`)
        .join('');

    feedbackPrompt = `
You previously provided suggestions that the user marked as incorrect. Please learn from this feedback and avoid making similar mistakes.
User Feedback on previous analysis:
${feedbackItems}
    `;
  }
  
  const languageContext = (language && language !== 'Auto-detect') 
    ? `The user has specified the language as ${language}. All analysis should be based on this language.` 
    : 'First, you must detect the programming language of the code provided.';

  const prompt = `
    ${persona.prompt}
    ${feedbackPrompt}
    Your response MUST be a valid JSON object. Do not include any text outside of the JSON object. Do not use markdown backticks like \`\`\`json.
    
    **Crucially, you must adhere to these rules:**
    1. ${languageContext} The detected language should be returned in the 'detected_language' field.
    2.  The 'summary' must first describe what the code appears to be trying to accomplish, and then provide a high-level assessment of its quality.
    3.  You MUST always provide a 'suggested_fix'. If the correct action is to delete the code, the 'suggested_fix' should be an empty string. If no direct code change is applicable (e.g., conceptual advice), provide the suggestion as a code comment in the 'suggested_fix' block.
    4.  The 'suggested_fix' MUST be a code block that is a direct REPLACEMENT for the original code.
    5.  For multi-line fixes, the 'suggested_fix' MUST contain the complete new code block. You MUST also provide both 'line_start' and 'line_end'.
    6.  For single-line fixes, provide 'line_start' and omit 'line_end'.
    7.  You MUST provide the 'original_code' field, containing the exact, unmodified lines of code that your suggestion is meant to replace. This is critical for the client to find and replace the code correctly.
    8.  Analyze variable names for clarity and suggest better names under the 'readability' issue_type.
    9.  Look for opportunities to use more efficient data structures (e.g., a Map for lookups instead of an Array). Report these under the 'optimize' issue_type.
    10. All 'suggested_fix' values must be "safe refactors" that improve code quality without altering its logical output, unless the 'issue_type' is 'logic'.
    11. Ensure all code suggestions are syntactically correct.
    12. When suggesting the functional update form for React's \`useState\` (e.g., \`setCount(c => c + 1)\`), clearly explain that the parameter (e.g., 'c' or 'prevCount') is the guaranteed latest state provided by React, which prevents bugs related to stale closures when the new state depends on the previous state.
    13. Actively identify and question code that appears to be useless, redundant, or serves no logical purpose (e.g., empty loops that only burn CPU cycles, variables that are declared but never used meaningfully). Suggest removing or refactoring such code under the 'logic' or 'readability' issue_type and explain *why* it's problematic.
    14. Be exhaustive and thorough on your first review. The user expects a comprehensive analysis that identifies every possible issue. Do not hold back suggestions for a second pass.

    The JSON object must have the following structure:
    {
      "detected_language": "<string: e.g., 'JavaScript', 'Python', 'Unknown'>",
      "summary": "<string>",
      "feedback": [
        {
          "line_start": <number>,
          "line_end": <number | undefined>,
          "original_code": "<string: The exact code snippet to be replaced, preserving all original whitespace and newlines.>",
          "issue_type": "<'logic' | 'performance' | 'optimize' | 'style' | 'readability' | 'security' | 'best-practice' | 'other'>",
          "explanation": "<string>",
          "suggested_fix": "<string: A single line or multi-line block of code to replace the original. NO BASE INDENTATION.>"
        }
      ]
    }
    
    Use the 'optimize' issue_type for suggestions that specifically improve runtime performance or algorithmic efficiency.
    
    Analyze the following code, including its comments:
    ---
    ${code}
    ---
    
    Provide your review. If there are no issues, return an object with an appropriate summary, the detected language, and an empty feedback array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detected_language: { type: Type.STRING },
            summary: { type: Type.STRING },
            feedback: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  line_start: { type: Type.NUMBER },
                  line_end: { type: Type.NUMBER },
                  original_code: { type: Type.STRING },
                  issue_type: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  suggested_fix: { type: Type.STRING },
                },
                required: ["line_start", "original_code", "issue_type", "explanation", "suggested_fix"],
              }
            }
          },
          required: ["detected_language", "summary", "feedback"],
        }
      },
    });

    const text = response.text.trim();
    if (!text) {
        return { summary: 'Analysis could not be completed.', feedback: [], detected_language: 'Unknown' };
    }
    const parsed = JSON.parse(text);
    return parsed as ApiCodeReview;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get code review from Gemini API: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching the code review.");
  }
};

export { getCodeReview };