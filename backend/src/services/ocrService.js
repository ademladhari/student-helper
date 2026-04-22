import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import Ocr from "@gutenye/ocr-node";

let ocrInstancePromise = null;

function scoreText(text, confidence) {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const alphaMatches = trimmed.match(/[A-Za-z]/g) || [];
  const alphaRatio =
    trimmed.length === 0 ? 0 : alphaMatches.length / trimmed.length;
  const digitRatio = trimmed.length === 0 ? 0 : (trimmed.match(/\d/g) || []).length / trimmed.length;
  const punctuationRatio =
    trimmed.length === 0 ? 0 : (trimmed.match(/[.,:;/-]/g) || []).length / trimmed.length;
  const digitTokenCount = (trimmed.match(/\b\d+[/:.-]?\d*\b/g) || []).length;
  const wordBonus = Math.min(words.length * 2, 18);
  const lineBonus = trimmed.split(/\n+/).filter(Boolean).length * 2;
  const lengthBonus = Math.min(trimmed.length / 20, 10);
  const structureBonus = Math.min((digitRatio * 18) + (punctuationRatio * 10) + (digitTokenCount * 3), 16);
  const garbagePenalty = Math.max(0, (trimmed.match(/[^\w\s.,:;/-]/g) || []).length - 2) * 1.1;

  return (
    confidence * 1.35 + wordBonus + lineBonus + lengthBonus + alphaRatio * 8 + structureBonus - garbagePenalty
  );
}

function looksLikeReadableText(text) {
  const trimmed = text.trim();

  if (trimmed.length < 8) {
    return false;
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const alphaMatches = trimmed.match(/[A-Za-z]/g) || [];
  const alphaRatio = alphaMatches.length / trimmed.length;
  const wordCount = words.length;
  const hasLetterWord = words.some((word) => /[A-Za-z]{3,}/.test(word));
  const digitCount = (trimmed.match(/\d/g) || []).length;
  const digitTokenCount = (trimmed.match(/\b\d+[/:.-]?\d*\b/g) || []).length;
  const looksLikeDateOrTime = /\b\d{1,2}[/:.-]\d{1,2}([/:.-]\d{2,4})?\b/.test(trimmed) || /\b\d{3,}\b/.test(trimmed);
  const commonWordCount = words.filter((word) => {
    const normalized = word.toLowerCase().replace(/[^a-z]/g, "");
    return [
      "the",
      "and",
      "for",
      "with",
      "this",
      "that",
      "due",
      "submit",
      "assignment",
      "quiz",
      "exam",
      "chapter",
      "study",
      "read",
      "write",
      "task",
      "deadline",
      "notes",
      "project",
      "homework",
    ].includes(normalized);
  }).length;
  const hasDateOrNumber = digitCount > 0 || digitTokenCount > 0;

  return (
    (hasLetterWord && alphaRatio > 0.25 && wordCount >= 2 && (commonWordCount >= 2 || hasDateOrNumber)) ||
    (looksLikeDateOrTime && digitCount >= 4 && wordCount >= 1)
  );
}

function cleanReadableText(text) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const words = line.split(/\s+/).filter(Boolean);
      const letterWords = words.filter((word) =>
        /[A-Za-z]{3,}/.test(word),
      ).length;
      const alphaCount = (line.match(/[A-Za-z]/g) || []).length;
      const digitCount = (line.match(/\d/g) || []).length;
      const looksLikeDateOrTime = /\b\d{1,2}[/:.-]\d{1,2}([/:.-]\d{2,4})?\b/.test(line) || /\b\d{3,}\b/.test(line);

      return (
        (line.length >= 4 && words.length >= 1 && alphaCount / line.length > 0.2) ||
        (looksLikeDateOrTime && digitCount >= 3) ||
        (digitCount >= 4 && words.length >= 1)
      );
    })
    .join("\n")
    .trim();
}

function normalizeLineScore(score) {
  if (!Number.isFinite(score)) {
    return 0;
  }

  if (score <= 1) {
    return Math.max(0, Math.min(1, score));
  }

  return Math.max(0, Math.min(1, score / 100));
}

async function getOcrInstance() {
  if (!ocrInstancePromise) {
    ocrInstancePromise = Ocr.create({
      isDebug: false,
    });
  }

  return ocrInstancePromise;
}

async function preprocessImage(imageBuffer, variant = "standard") {
  const image = sharp(imageBuffer, { failOn: "none" });
  const metadata = await image.metadata();
  const maxWidth = variant === "threshold" ? 1800 : variant === "detail" ? 2400 : 2200;

  let basePipeline = image
    .rotate()
    .resize({
      width: metadata.width && metadata.width > maxWidth ? maxWidth : undefined,
      withoutEnlargement: true,
    })
    .grayscale()
    .normalize();

  if (variant === "detail") {
    basePipeline = basePipeline.modulate({ brightness: 1.08, saturation: 0 });
  }

  if (variant === "threshold") {
    return basePipeline.sharpen().threshold(165).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  }

  if (variant === "detail") {
    return basePipeline.sharpen({ sigma: 1.1 }).jpeg({ quality: 94, mozjpeg: true }).toBuffer();
  }

  return basePipeline.sharpen().jpeg({ quality: 92, mozjpeg: true }).toBuffer();
}

async function createTemporaryImageFile(imageBuffer, variant) {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "student-helper-ocr-"));
  const filePath = path.join(
    tempDirectory,
    `${variant}-${Date.now()}-${randomUUID()}.jpg`,
  );
  const processedBuffer = await preprocessImage(imageBuffer, variant);

  await fs.writeFile(filePath, processedBuffer);

  return {
    filePath,
    tempDirectory,
    bytes: processedBuffer.length,
  };
}

function summarizeLines(lines) {
  const sortedLines = [...(lines || [])].sort((left, right) => {
    const leftTop = left?.frame?.top ?? 0;
    const rightTop = right?.frame?.top ?? 0;

    if (leftTop !== rightTop) {
      return leftTop - rightTop;
    }

    const leftLeft = left?.frame?.left ?? 0;
    const rightLeft = right?.frame?.left ?? 0;

    return leftLeft - rightLeft;
  });

  const rawText = sortedLines
    .map((line) => String(line?.text ?? "").trim())
    .filter(Boolean)
    .join("\n")
    .trim();

  const readableText = cleanReadableText(rawText) || rawText;
  const lineConfidenceValues = sortedLines.map((line) => normalizeLineScore(line?.score));
  const averageConfidence = lineConfidenceValues.length
    ? lineConfidenceValues.reduce((sum, value) => sum + value, 0) / lineConfidenceValues.length
    : 0;
  const confidence = Math.max(0, Math.min(100, Math.round(averageConfidence * 100)));

  return {
    text: readableText,
    confidence,
    readable: looksLikeReadableText(readableText),
    score: scoreText(readableText, confidence),
    lineCount: sortedLines.length,
  };
}

async function runGutenOcrPass(imageBuffer, variant) {
  const { filePath, tempDirectory, bytes } = await createTemporaryImageFile(
    imageBuffer,
    variant,
  );

  try {
    const ocr = await getOcrInstance();
    const lines = await ocr.detect(filePath);
    const summary = summarizeLines(lines);

    return {
      ...summary,
      source: `gutenye:${variant}`,
      previewBytes: bytes,
    };
  } finally {
    await fs.rm(tempDirectory, { recursive: true, force: true });
  }
}

export async function extractTextFromImageBuffer(imageBuffer) {
  const startedAt = Date.now();

  console.log("[OCR] Running Guten OCR pipeline", {
    bufferBytes: imageBuffer.length,
  });

  const candidates = [];

  for (const variant of ["standard", "threshold"]) {
    try {
      console.log("[OCR] Trying Guten OCR", { variant });
      candidates.push(await runGutenOcrPass(imageBuffer, variant));
    } catch (error) {
      console.warn("[OCR] Guten OCR failed", {
        variant,
        message: error.message,
      });
    }
  }

  candidates.sort((left, right) => right.score - left.score);

  if (!candidates.length) {
    throw new Error("Guten OCR could not process the uploaded image");
  }

  const finalResult =
    candidates.find((candidate) => candidate.readable) || candidates[0];
  const cleanedText = cleanReadableText(finalResult.text);
  const trimmedText = cleanedText && cleanedText.length >= Math.min(12, finalResult.text.trim().length)
    ? cleanedText
    : finalResult.text.trim();
  const confidence = finalResult.confidence;
  const readableText = looksLikeReadableText(trimmedText);

  console.log("[OCR] Recognition finished", {
    durationMs: Date.now() - startedAt,
    textLength: trimmedText.length,
    confidence,
    readableText,
    source: finalResult.source,
    candidates: candidates.map((candidate) => ({
      source: candidate.source,
      confidence: candidate.confidence,
      score: Math.round(candidate.score),
      readable: candidate.readable,
      textPreview: candidate.text.slice(0, 80),
      previewBytes: candidate.previewBytes,
    })),
  });

  return {
    text: trimmedText,
    confidence,
    source: finalResult.source,
  };
}
