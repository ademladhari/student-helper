export function getGeminiGenerateContentUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

export function getGeminiRequestHeaders(apiKey: string) {
  return {
    'Content-Type': 'application/json',
    'X-goog-api-key': apiKey,
  };
}
