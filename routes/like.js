const express = require("express");
const Post = require("../models/Post");
const Like = require("../models/Like");
const { createNotification } = require("../services/notificationService");
const auth = require("../middleware/auth");

const router = express.Router();

// Like a post
router.post("/:postId", auth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if already liked
    const existingLike = await Like.findOne({
      user: userId,
      post: postId,
    });

    if (existingLike) {
      return res.status(400).json({ message: "Post already liked" });
    }

    // Create like
    const like = new Like({
      user: userId,
      post: postId,
    });

    await like.save();

    // Add like to post
    await Post.findByIdAndUpdate(postId, {
      $push: { likes: userId },
    });

    // Create notification if user is not liking their own post
    if (post.user.toString() !== userId.toString()) {
      const io = req.app.get("io");
      await createNotification(post.user, userId, "like", postId, io);
    }

    res.json({ message: "Post liked successfully" });
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Unlike a post
router.delete("/:postId", auth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Remove like
    await Like.findOneAndDelete({
      user: userId,
      post: postId,
    });

    // Remove like from post
    await Post.findByIdAndUpdate(postId, {
      $pull: { likes: userId },
    });

    res.json({ message: "Post unliked successfully" });
  } catch (error) {
    console.error("Unlike post error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get likes for a post
router.get("/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const post = await Post.findById(postId).populate({
      path: "likes",
      select: "username fullName profilePicture",
      options: { skip, limit },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const totalLikes = post.likes.length;

    res.json({
      likes: post.likes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalLikes / limit),
        totalLikes,
      },
    });
  } catch (error) {
    console.error("Get likes error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Check if current user liked a post
router.get("/status/:postId", auth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;

    const like = await Like.findOne({
      user: userId,
      post: postId,
    });

    res.json({ isLiked: !!like });
  } catch (error) {
    console.error("Check like status error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
