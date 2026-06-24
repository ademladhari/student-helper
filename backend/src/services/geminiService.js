import { getGeminiGenerateContentUrl, getGeminiRequestHeaders } from "../utils/geminiRequest.js";

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-flash-latest";

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY on backend.");
  }

  return { apiKey, model };
}

async function readGeminiError(response) {
  try {
    const errBody = await response.json();
    if (typeof errBody?.error?.message === "string") {
      return errBody.error.message;
    }
    return JSON.stringify(errBody);
  } catch {
    return response.text();
  }
}

export async function generateGeminiText(parts) {
  const { apiKey, model } = getGeminiConfig();
  const endpoint = getGeminiGenerateContentUrl(model);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: getGeminiRequestHeaders(apiKey),
    body: JSON.stringify({
      contents: [
        {
          parts,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await readGeminiError(response);
    throw new Error(detail || `Gemini request failed (${response.status})`);
  }

  const payload = await response.json();
  const aiText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!aiText || typeof aiText !== "string") {
    throw new Error("Gemini returned an empty response.");
  }

  return aiText;
}

export async function generateGeminiPrompt(prompt) {
  return generateGeminiText([{ text: prompt }]);
}
