import { extractTextFromImageBuffer } from "../services/ocrService.js";

export async function extractOcrText(req, res) {
  const startedAt = Date.now();

  try {
    console.log("[OCR] Request received", {
      originalName: req.file?.originalname,
      mimeType: req.file?.mimetype,
      size: req.file?.size,
    });

    if (!req.file || !req.file.buffer) {
      return res
        .status(400)
        .json({ message: "Image file is required as field 'image'" });
    }

    const result = await extractTextFromImageBuffer(req.file.buffer);

    console.log("[OCR] Request completed", {
      durationMs: Date.now() - startedAt,
      originalName: req.file.originalname,
      confidence: result.confidence,
      textLength: result.text.length,
    });

    return res.json({
      text: result.text,
      confidence: Math.round(result.confidence),
      source: result.source,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    console.error("[OCR] Request failed", {
      durationMs: Date.now() - startedAt,
      message: error.message,
    });

    const isUploadValidationError =
      error.message?.includes("Only JPG") || error.code === "LIMIT_FILE_SIZE";

    if (isUploadValidationError) {
      return res.status(400).json({
        message: "Invalid upload",
        detail: error.message,
      });
    }

    return res.status(500).json({
      message: "OCR extraction failed",
      detail: error.message,
    });
  }
}
