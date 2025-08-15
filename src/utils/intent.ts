export type Intent = "note" | "define" | "fact" | "book" | "unknown";

export interface ParsedIntent {
  intent: Intent;
  payload: string;
  bookId?: string; // For book-specific questions
}

import { isQuestionAboutBook, getCurrentBookId } from './bookSummary';

export function parseIntent(text: string): ParsedIntent {
  const trimmed = text.trim();
  
  // Note: starts with "note:" or "note" command
  const noteMatch = /^(note|take a note|remember this|remember)\s*[:\-]?\s*(.*)/i.exec(trimmed);
  if (noteMatch) {
    return { intent: "note", payload: noteMatch[2].trim() };
  }

  // Define: starts with "define" word
  const defineMatch = /^(define\s+)(.+)/i.exec(trimmed);
  if (defineMatch) {
    return { intent: "define", payload: defineMatch[2].trim() };
  }

  // Book: check if question is about a specific book we have summaries for
  const currentBookId = getCurrentBookId();
  if (isQuestionAboutBook(trimmed, currentBookId)) {
    return { intent: "book", payload: trimmed, bookId: currentBookId };
  }

  // Fact: interrogative questions.
  // simple heuristic: starts with who|what|when|where|why|how or contains 'fact'
  const factMatch = /^(who|what|when|where|why|how)\b.+/i.exec(trimmed);
  if (factMatch) {
    return { intent: "fact", payload: trimmed };
  }

  return { intent: "unknown", payload: trimmed };
} 