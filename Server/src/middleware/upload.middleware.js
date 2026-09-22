const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ApiError = require("../utils/ApiError.js");

const tempDir = path.join(process.cwd(), "uploads", "temp");

fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    cb(null, uniqueName);
  },
});

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new ApiError(400, "Only image files are allowed (jpeg, png, webp, gif, avif)"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter,
});

module.exports = upload;
