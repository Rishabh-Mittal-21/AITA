
import { GoogleGenAI, Type } from "@google/genai";
import type { Persona, ReviewChunk } from '../types';

const getCodeReview = async (code: string, persona: Persona): Promise<ReviewChunk[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    ${persona.prompt}
    Your response MUST be a valid JSON array of objects. Do not include any text outside of the JSON array. Do not use markdown backticks like \`\`\`json.
    Each object in the array represents a single piece of feedback on the provided code and must have the following structure:
    {
      "line_reference": <number>,
      "issue_type": "<'logic' | 'performance' | 'style' | 'readability' | 'security' | 'best-practice' | 'other'>",
      "explanation": "<string>",
      "suggested_fix": "<string>"
    }
    
    Analyze the following code:
    ---
    ${code}
    ---
    
    Provide your review. If there are no issues, return an empty array [].
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              line_reference: { type: Type.NUMBER },
              issue_type: { type: Type.STRING },
              explanation: { type: Type.STRING },
              suggested_fix: { type: Type.STRING },
            },
            required: ["line_reference", "issue_type", "explanation", "suggested_fix"],
          }
        }
      },
    });

    const text = response.text.trim();
    if (!text) {
        return [];
    }
    const parsed = JSON.parse(text);
    return parsed as ReviewChunk[];

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get code review from Gemini API: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching the code review.");
  }
};

export { getCodeReview };
