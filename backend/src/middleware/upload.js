import multer from "multer";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
const aiAllowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, or WEBP images are allowed for OCR"));
  }

  cb(null, true);
}

export const ocrUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1,
  },
});

function aiFileFilter(_req, file, cb) {
  if (!aiAllowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Only PDF or image files are allowed for AI summary"));
  }

  cb(null, true);
}

export const aiUpload = multer({
  storage,
  fileFilter: aiFileFilter,
  limits: {
    fileSize: 12 * 1024 * 1024,
    files: 12,
  },
});
