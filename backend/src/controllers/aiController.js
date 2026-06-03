import { buildLibrarySummary } from "../services/aiSummaryService.js";

export async function summarizeLibraryFiles(req, res) {
  const startedAt = Date.now();

  try {
    const files = Array.isArray(req.files) ? req.files : [];

    if (files.length === 0) {
      return res.status(400).json({
        message: "No files uploaded",
        detail: "Attach PDFs or images as multipart form-data field 'files'.",
      });
    }

    const result = await buildLibrarySummary(files);

    console.log("[AI] Summary completed", {
      durationMs: Date.now() - startedAt,
      fileCount: files.length,
      extractedCount: result.filesProcessed,
      skippedCount: result.filesSkipped,
    });

    return res.json(result);
  } catch (error) {
    console.error("[AI] Summary failed", {
      durationMs: Date.now() - startedAt,
      message: error.message,
    });

    const isUploadValidationError =
      error.message?.includes("Only") || error.code === "LIMIT_FILE_SIZE";

    if (isUploadValidationError) {
      return res.status(400).json({
        message: "Invalid upload",
        detail: error.message,
      });
    }

    return res.status(500).json({
      message: "AI summary failed",
      detail: error.message,
    });
  }
}
