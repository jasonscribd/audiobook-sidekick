// Utility for loading and managing book summaries

export interface BookSummary {
  title: string;
  content: string;
  lastLoaded?: Date;
}

// Cache to avoid repeated fetches
const summaryCache = new Map<string, BookSummary>();

/**
 * Load a book summary from the summaries folder
 * @param bookId - The book identifier (e.g., 'treasure-island')
 * @returns Promise<BookSummary | null>
 */
export async function loadBookSummary(bookId: string): Promise<BookSummary | null> {
  // Check cache first
  const cached = summaryCache.get(bookId);
  if (cached && cached.lastLoaded && Date.now() - cached.lastLoaded.getTime() < 300000) {
    // Use cached version if less than 5 minutes old
    return cached;
  }

  try {
    // Map book IDs to summary file names
    const summaryFileMap: Record<string, string> = {
      'treasure-island': 'treasureislandsummary.md',
      // Add more books here as needed
    };

    const fileName = summaryFileMap[bookId];
    if (!fileName) {
      return null; // No summary available for this book
    }

    // Fetch the summary file from public/summaries/
    const response = await fetch(`/summaries/${fileName}`);
    if (!response.ok) {
      console.warn(`Failed to load summary for ${bookId}: ${response.status}`);
      return null;
    }

    const content = await response.text();
    const summary: BookSummary = {
      title: bookId === 'treasure-island' ? 'Treasure Island' : bookId,
      content,
      lastLoaded: new Date(),
    };

    // Cache the loaded summary
    summaryCache.set(bookId, summary);
    return summary;
  } catch (error) {
    console.error(`Error loading summary for ${bookId}:`, error);
    return null;
  }
}

/**
 * Check if a question is about a specific book
 * @param question - The user's question
 * @param bookId - The book to check for
 * @returns boolean
 */
export function isQuestionAboutBook(question: string, bookId: string): boolean {
  const lowerQuestion = question.toLowerCase();
  
  if (bookId === 'treasure-island') {
    const treasureIslandKeywords = [
      'treasure island',
      'jim hawkins',
      'long john silver',
      'captain flint',
      'ben gunn',
      'dr livesey', 'dr. livesey',
      'squire trelawney',
      'captain smollett',
      'hispaniola',
      'black spot',
      'billy bones',
      'israel hands',
      'admiral benbow',
      'parrot',
      'pieces of eight',
      'stevenson',
      'robert louis stevenson',
    ];

    return treasureIslandKeywords.some(keyword => 
      lowerQuestion.includes(keyword)
    );
  }
  
  return false;
}

/**
 * Get the current book being discussed based on context
 * This could be enhanced to track conversation context
 * @returns string - current book ID or default
 */
export function getCurrentBookId(): string {
  // For now, default to treasure-island since that's what the app focuses on
  // In a multi-book app, this could check URL params, user settings, etc.
  return 'treasure-island';
}

/**
 * Create enhanced context for book-specific questions
 * @param question - The user's question
 * @param bookId - The book ID to get context for
 * @returns Promise<string> - Enhanced prompt with book context
 */
export async function createBookEnhancedPrompt(
  question: string,
  bookId: string
): Promise<string> {
  const summary = await loadBookSummary(bookId);
  
  if (!summary) {
    // No summary available, return original question
    return question;
  }

  // Create an enhanced prompt that includes the book context
  const enhancedPrompt = `You are answering a question about ${summary.title}. Use the detailed book information below to provide accurate, specific answers. If the question isn't directly about the book content, answer normally.

BOOK CONTEXT FOR ${summary.title.toUpperCase()}:
${summary.content}

USER QUESTION: ${question}

Please provide a helpful answer using the book context when relevant. Keep responses concise (1-2 sentences for simple questions, more detail for complex questions).`;

  return enhancedPrompt;
}
