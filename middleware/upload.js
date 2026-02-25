const multer = require("multer");
const path = require("path");
const { uploadFile } = require("../config/minio");

// Configure storage using memory storage for MinIO
const storage = multer.memoryStorage();

// File filter for images and videos
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const allowedVideoTypes = [
    "video/mp4",
    "video/avi",
    "video/mov",
    "video/wmv",
    "video/flv",
    "video/webm",
  ];

  if (
    allowedImageTypes.includes(file.mimetype) ||
    allowedVideoTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, AVI, MOV, WMV, FLV, WebM) are allowed.",
      ),
      false,
    );
  }
};

// Configure upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit per file
    files: 10, // Maximum 10 files
  },
  fileFilter: fileFilter,
});

// Middleware to handle MinIO upload
const uploadToMinio = async (req, res, next) => {
  try {
    if (!req.files && !req.file) {
      return next();
    }

    const files = req.files || [req.file];
    const uploadPromises = [];

    if (Array.isArray(files)) {
      // Multiple files
      for (const file of files) {
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        uploadPromises.push(uploadFile(file, fileName));
      }
    } else if (files) {
      // Single file
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(files.originalname)}`;
      uploadPromises.push(uploadFile(files, fileName));
    }

    const uploadedUrls = await Promise.all(uploadPromises);

    // Store uploaded URLs in request for later use
    req.uploadedUrls = uploadedUrls;

    next();
  } catch (error) {
    console.error("Error uploading to MinIO:", error);
    res.status(500).json({ message: "Error uploading files" });
  }
};

// Single file upload (for backward compatibility)
const uploadSingle = [upload.single("media"), uploadToMinio];

// Multiple files upload
const uploadMultiple = [upload.array("media", 10), uploadToMinio];

module.exports = {
  uploadSingle,
  uploadMultiple,
};
