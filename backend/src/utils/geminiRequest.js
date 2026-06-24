export function getGeminiGenerateContentUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

export function getGeminiRequestHeaders(apiKey) {
  return {
    "Content-Type": "application/json",
    "X-goog-api-key": apiKey,
  };
}
