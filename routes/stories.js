const express = require("express");
const { body, validationResult } = require("express-validator");
const Story = require("../models/Story");
const auth = require("../middleware/auth");
const multer = require("multer");
const { uploadToMinio } = require("../config/minio");
const { uploadSingle } = require("../middleware/upload");

const router = express.Router();

// Multer config for story uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for stories"), false);
    }
  },
});

// Get all active stories (non-expired)
router.get("/", auth, async (req, res) => {
  try {
    const stories = await Story.find({
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username profilePicture")
      .populate("viewers.user", "username profilePicture")
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error("Get stories error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get stories from users you follow
router.get("/following", auth, async (req, res) => {
  try {
    const User = require("../models/User");
    const currentUser = await User.findById(req.user._id);

    const stories = await Story.find({
      user: { $in: [...currentUser.following, req.user._id] },
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username profilePicture")
      .populate("viewers.user", "username profilePicture")
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error("Get following stories error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's own stories
router.get("/my-stories", auth, async (req, res) => {
  try {
    const stories = await Story.find({
      user: req.user._id,
      expiresAt: { $gt: new Date() },
    })
      .populate("user", "username profilePicture")
      .populate("viewers.user", "username profilePicture")
      .sort({ createdAt: -1 });

    res.json(stories);
  } catch (error) {
    console.error("Get my stories error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new story
router.post(
  "/",
  auth,
  uploadSingle,
  [
    body("caption")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Caption must be less than 500 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Image is required for story" });
      }

      const story = new Story({
        user: req.user._id,
        image: req.uploadedUrls[0],
        caption: req.body.caption || "",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      });

      await story.save();
      await story.populate("user", "username profilePicture");

      res.status(201).json(story);
    } catch (error) {
      console.error("Create story error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// View a story (add to viewers)
router.post("/:storyId/view", auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    if (new Date() > story.expiresAt) {
      return res.status(410).json({ message: "Story has expired" });
    }

    await story.addViewer(req.user._id);
    await story.populate("user", "username profilePicture");
    await story.populate("viewers.user", "username profilePicture");

    res.json(story);
  } catch (error) {
    console.error("View story error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a story (only owner)
router.delete("/:storyId", auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    if (story.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this story" });
    }

    await Story.findByIdAndDelete(req.params.storyId);
    res.json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("Delete story error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
