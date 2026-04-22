import { Router } from "express";
import { extractOcrText } from "../controllers/ocrController.js";
import { ocrUpload } from "../middleware/upload.js";

const router = Router();

router.post("/extract", ocrUpload.single("image"), extractOcrText);

export default router;
