const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Update user profile
router.put(
  "/profile",
  auth,
  [
    body("fullName")
      .optional()
      .isLength({ min: 1, max: 50 })
      .trim()
      .withMessage("Full name must be 1-50 characters"),
    body("bio")
      .optional()
      .isLength({ max: 150 })
      .withMessage("Bio must be less than 150 characters"),
    body("username")
      .optional()
      .isLength({ min: 3, max: 30 })
      .trim()
      .withMessage("Username must be 3-30 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { fullName, bio, username } = req.body;
      const updateData = {};

      if (fullName) updateData.fullName = fullName;
      if (bio !== undefined) updateData.bio = bio;
      if (username) {
        // Check if username is already taken
        const existingUser = await User.findOne({
          username,
          _id: { $ne: req.user._id },
        });

        if (existingUser) {
          return res.status(400).json({ message: "Username is already taken" });
        }

        updateData.username = username;
      }

      const user = await User.findByIdAndUpdate(req.user._id, updateData, {
        new: true,
      }).select("-password");

      res.json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          bio: user.bio,
          profilePicture: user.profilePicture,
          followers: user.followers,
          following: user.following,
          isVerified: user.isVerified,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Search users
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query || query.trim().length === 0) {
      return res.json([]);
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { fullName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("username fullName email profilePicture")
      .limit(10);

    res.json(users);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Search users by query parameter (legacy route)
router.get("/search/:query", async (req, res) => {
  try {
    const query = req.params.query;
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { fullName: { $regex: query, $options: "i" } },
      ],
    })
      .select("username fullName profilePicture")
      .limit(10);

    res.json({ users });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user profile by username
router.get("/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("-password")
      .populate("posts", "image caption likesCount commentsCount createdAt")
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        bio: user.bio,
        profilePicture: user.profilePicture,
        followers: user.followers,
        following: user.following,
        posts: user.posts,
        followersCount: user.getFollowersCount(),
        followingCount: user.getFollowingCount(),
        postsCount: user.getPostsCount(),
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
