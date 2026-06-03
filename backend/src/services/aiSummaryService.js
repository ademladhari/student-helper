import pdfParse from "pdf-parse";
import { extractTextFromImageBuffer } from "./ocrService.js";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const PDF_TYPES = new Set(["application/pdf"]);

const MAX_TOTAL_CHARS = 22000;
const MAX_FILE_CHARS = 5000;
const MAX_IMAGE_FILES = 4;

function normalizeText(input) {
  return String(input || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function clampText(text, maxChars) {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars).trim()}\n...[truncated]`;
}

function isPdfFile(file) {
  return PDF_TYPES.has(file.mimetype);
}

function isImageFile(file) {
  return IMAGE_TYPES.has(file.mimetype);
}

async function extractTextFromFile(file) {
  if (isPdfFile(file)) {
    const pdf = await pdfParse(file.buffer, { max: 0 });
    return {
      text: normalizeText(pdf.text || ""),
      source: "pdf",
    };
  }

  if (isImageFile(file)) {
    const result = await extractTextFromImageBuffer(file.buffer);
    return {
      text: normalizeText(result.text || ""),
      source: "ocr",
    };
  }

  throw new Error(`Unsupported file type: ${file.mimetype || "unknown"}`);
}

function parseInsightsJson(raw) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response did not include a JSON object.");
  }
  const jsonSlice = raw.slice(start, end + 1);
  const parsed = JSON.parse(jsonSlice);
  const summary = String(parsed.summary || "").trim();
  const explanation = String(parsed.explanation || "").trim();
  if (!summary && !explanation) {
    throw new Error("AI returned empty summary and explanation.");
  }
  return { summary, explanation };
}

function buildPrompt(items) {
  if (!items.length) {
    return `You are a supportive study assistant. The student shared images and/or documents for review.\n\nProvide a helpful summary and study guidance based only on the content provided.\n\nRespond with ONLY valid JSON (no markdown): {"summary":"...","explanation":"..."}.\n- summary: 2-4 concise sentences about the topics covered and how complete the materials seem.\n- explanation: one short paragraph of practical study advice and next steps.`;
  }

  const content = items
    .map((item) => `File: ${item.name}\nType: ${item.kind}\nContent:\n${item.text}`)
    .join("\n\n---\n\n");

  return `You are a supportive study assistant. The student shared extracted text from their documents.\n\nProvide a helpful summary and study guidance based only on the extracted text below.\n\nRespond with ONLY valid JSON (no markdown): {"summary":"...","explanation":"..."}.\n- summary: 2-4 concise sentences about the topics covered and how complete the materials seem.\n- explanation: one short paragraph of practical study advice and next steps.\n\nExtracted content:\n${content}`;
}

function buildImageParts(files) {
  return files.map((file) => ({
    inlineData: {
      mimeType: file.mimetype,
      data: file.buffer.toString("base64"),
    },
  }));
}

async function requestGemini(parts) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY on backend.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const errBody = await response.json();
      detail = typeof errBody?.error?.message === "string"
        ? errBody.error.message
        : JSON.stringify(errBody);
    } catch {
      detail = await response.text();
    }
    throw new Error(detail || `Gemini request failed (${response.status})`);
  }

  const payload = await response.json();
  const aiText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!aiText || typeof aiText !== "string") {
    throw new Error("Gemini returned an empty response.");
  }

  return parseInsightsJson(aiText);
}

export async function buildLibrarySummary(files) {
  const extracted = [];
  const skipped = [];
  const imageFiles = [];

  for (const file of files) {
    try {
      if (isImageFile(file)) {
        imageFiles.push(file);
        continue;
      }

      const { text, source } = await extractTextFromFile(file);
      const trimmed = clampText(text, MAX_FILE_CHARS);

      if (!trimmed) {
        skipped.push({ name: file.originalname, reason: "empty" });
        continue;
      }

      extracted.push({
        name: file.originalname || "Untitled file",
        kind: source,
        text: trimmed,
      });
    } catch (error) {
      skipped.push({
        name: file.originalname || "unknown",
        reason: error.message,
      });
    }
  }

  if (extracted.length === 0 && imageFiles.length === 0) {
    throw new Error("No readable text could be extracted from the uploaded files.");
  }

  let totalChars = 0;
  const trimmedItems = [];
  for (const item of extracted) {
    if (totalChars >= MAX_TOTAL_CHARS) {
      break;
    }
    const remaining = MAX_TOTAL_CHARS - totalChars;
    const text = clampText(item.text, remaining);
    trimmedItems.push({ ...item, text });
    totalChars += text.length;
  }

  const prompt = buildPrompt(trimmedItems);
  const imageParts = buildImageParts(imageFiles.slice(0, MAX_IMAGE_FILES));
  const parts = [{ text: prompt }, ...imageParts];
  const { summary, explanation } = await requestGemini(parts);

  return {
    summary,
    explanation,
    filesProcessed: extracted.length,
    filesSkipped: skipped.length + Math.max(0, imageFiles.length - MAX_IMAGE_FILES),
    skipped,
  };
}
