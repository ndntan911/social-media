const express = require("express");
const { body, validationResult } = require("express-validator");
const Post = require("../models/Post");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { uploadSingle, uploadMultiple } = require("../middleware/upload");
const path = require("path");

const router = express.Router();

// Create a new post with multiple files
router.post(
  "/",
  auth,
  uploadMultiple,
  [
    body("caption")
      .optional()
      .isLength({ max: 2200 })
      .withMessage("Caption must be less than 2200 characters"),
    body("location")
      .optional()
      .isLength({ max: 50 })
      .withMessage("Location must be less than 50 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.uploadedUrls || req.uploadedUrls.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one media file is required" });
      }

      const { caption, location, tags } = req.body;

      // Process uploaded files from MinIO URLs
      const media = req.uploadedUrls.map((url, index) => {
        const isVideo =
          url.includes(".mp4") ||
          url.includes(".avi") ||
          url.includes(".mov") ||
          url.includes(".wmv") ||
          url.includes(".flv") ||
          url.includes(".webm");
        const fileName = url.split("/").pop();
        return {
          type: isVideo ? "video" : "image",
          url: url,
          thumbnail: isVideo ? "" : url, // For videos, you might want to generate thumbnails
        };
      });

      // Parse tags if provided
      let parsedTags = [];
      if (tags) {
        if (typeof tags === "string") {
          parsedTags = tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
        } else if (Array.isArray(tags)) {
          parsedTags = tags;
        }
      }

      // Create new post
      const post = new Post({
        user: req.user._id,
        media,
        caption: caption || "",
        location: location || "",
        tags: parsedTags,
      });

      await post.save();

      // Update user's posts array
      await User.findByIdAndUpdate(req.user._id, {
        $push: { posts: post._id },
      });

      // Populate user info for response
      await post.populate("user", "username profilePicture");

      res.status(201).json({
        post: {
          id: post._id,
          user: post.user,
          media: post.media,
          caption: post.caption,
          location: post.location,
          tags: post.tags,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          mediaCount: post.mediaCount,
          createdAt: post.createdAt,
        },
      });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Legacy single file upload endpoint (for backward compatibility)
router.post(
  "/single",
  auth,
  uploadSingle,
  [
    body("caption")
      .optional()
      .isLength({ max: 2200 })
      .withMessage("Caption must be less than 2200 characters"),
    body("location")
      .optional()
      .isLength({ max: 50 })
      .withMessage("Location must be less than 50 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.uploadedUrls || req.uploadedUrls.length === 0) {
        return res.status(400).json({ message: "Media file is required" });
      }

      const { caption, location, tags } = req.body;
      const url = req.uploadedUrls[0];

      // Process uploaded file from MinIO URL
      const isVideo =
        url.includes(".mp4") ||
        url.includes(".avi") ||
        url.includes(".mov") ||
        url.includes(".wmv") ||
        url.includes(".flv") ||
        url.includes(".webm");
      const media = [
        {
          type: isVideo ? "video" : "image",
          url: url,
          thumbnail: isVideo ? "" : url,
        },
      ];

      // Parse tags if provided
      let parsedTags = [];
      if (tags) {
        if (typeof tags === "string") {
          parsedTags = tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag);
        } else if (Array.isArray(tags)) {
          parsedTags = tags;
        }
      }

      // Create new post
      const post = new Post({
        user: req.user._id,
        media,
        caption: caption || "",
        location: location || "",
        tags: parsedTags,
      });

      await post.save();

      // Update user's posts array
      await User.findByIdAndUpdate(req.user._id, {
        $push: { posts: post._id },
      });

      // Populate user info for response
      await post.populate("user", "username profilePicture");

      res.status(201).json({
        post: {
          id: post._id,
          user: post.user,
          media: post.media,
          caption: post.caption,
          location: post.location,
          tags: post.tags,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          mediaCount: post.mediaCount,
          createdAt: post.createdAt,
        },
      });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Get feed (posts from followed users)
router.get("/feed", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get users that current user follows
    const currentUser = await User.findById(req.user._id).select("following");
    const followingIds = currentUser.following;

    // Add current user's ID to see their own posts
    followingIds.push(req.user._id);

    const posts = await Post.find({
      user: { $in: followingIds },
    })
      .populate("user", "username profilePicture")
      .populate("comments.user", "username profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments({
      user: { $in: followingIds },
    });

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
      },
    });
  } catch (error) {
    console.error("Get feed error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's posts
router.get("/user/:userId", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: req.params.userId })
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments({ user: req.params.userId });

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
      },
    });
  } catch (error) {
    console.error("Get user posts error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single post
router.get("/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("user", "username profilePicture")
      .populate("comments.user", "username profilePicture");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({ post });
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete post
router.delete("/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user owns the post
    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(req.params.postId);

    // Remove post from user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { posts: req.params.postId },
    });

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
