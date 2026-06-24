import { generateGeminiPrompt } from "./geminiService.js";

function parseTaskDraftsJson(rawText) {
  const start = rawText.indexOf("[");
  const end = rawText.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response did not include a JSON array.");
  }

  const jsonSlice = rawText.slice(start, end + 1);
  const items = JSON.parse(jsonSlice);

  if (!Array.isArray(items)) {
    throw new Error("AI response was not a JSON array.");
  }

  return items;
}

function sanitizePriority(input) {
  const normalized = String(input || "medium").trim().toLowerCase();
  if (normalized === "high" || normalized === "low" || normalized === "medium") {
    return normalized;
  }
  return "medium";
}

function minutesToPomodoros(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(value / 25));
}

function normalizeDraft(item, index) {
  const title = String(item?.title || "").trim() || `Task ${index + 1}`;
  const dueDateRaw = item?.dueDate ? new Date(item.dueDate) : new Date();
  const dueDate = Number.isNaN(dueDateRaw.getTime())
    ? new Date().toISOString()
    : dueDateRaw.toISOString();

  return {
    title,
    dueDate,
    estimatedPomodoros: minutesToPomodoros(item?.estimatedMinutes),
    priority: sanitizePriority(item?.priority),
  };
}

export async function generateTaskDraftsFromText(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    throw new Error("text is required");
  }

  const prompt = `You are a study assistant. Convert the OCR text into a concise JSON array of task drafts.

Rules:
- Output ONLY valid JSON (no markdown).
- Each item must have: title, dueDate (ISO 8601), estimatedMinutes (number), priority (low|medium|high).
- If no due date is in text, use today's date.
- Estimated minutes should be realistic (15-240).

OCR text:
${trimmed}`;

  const aiText = await generateGeminiPrompt(prompt);
  const items = parseTaskDraftsJson(aiText);

  return items.map((item, index) => normalizeDraft(item, index));
}
