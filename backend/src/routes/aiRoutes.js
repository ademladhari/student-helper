import { Router } from "express";
import { summarizeLibraryFiles } from "../controllers/aiController.js";
import { aiUpload } from "../middleware/upload.js";

const router = Router();

router.post("/summary", aiUpload.array("files", 12), summarizeLibraryFiles);

export default router;
