export function formatApiError(error) {
  if (!error) return 'Unknown error';

  const message = error.message ?? String(error);

  if (message.includes('quota') || message.includes('RESOURCE_EXHAUSTED')) {
    return 'Gemini API quota exceeded for this model. Set GEMINI_MODEL=gemini-2.5-flash in .env or enable billing for gemini-2.5-pro.';
  }

  if (message.includes('API key') || message.includes('API_KEY')) {
    return 'Invalid or missing Google API key. Check GOOGLE_GENERATIVE_AI_API_KEY in .env.';
  }

  if (message.includes('No output generated')) {
    return 'The model returned no output. This often means an API error occurred — check the server terminal for details.';
  }

  return message;
}
