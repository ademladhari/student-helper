import multer from "multer";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

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
