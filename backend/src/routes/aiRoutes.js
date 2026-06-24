import { Router } from "express";
import { generateScanTasks, summarizeLibraryFiles } from "../controllers/aiController.js";
import { aiUpload } from "../middleware/upload.js";

const router = Router();

router.post("/summary", aiUpload.array("files", 12), summarizeLibraryFiles);
router.post("/generate-tasks", generateScanTasks);

export default router;
