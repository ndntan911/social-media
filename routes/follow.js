const express = require("express");
const User = require("../models/User");
const Follow = require("../models/Follow");
const auth = require("../middleware/auth");

const router = express.Router();

// Follow a user
router.post("/:userId", auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    // Check if trying to follow self
    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: targetUserId,
    });

    if (existingFollow) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Create follow relationship
    const follow = new Follow({
      follower: currentUserId,
      following: targetUserId,
    });

    await follow.save();

    // Update user documents
    await User.findByIdAndUpdate(currentUserId, {
      $push: { following: targetUserId },
    });

    await User.findByIdAndUpdate(targetUserId, {
      $push: { followers: currentUserId },
    });

    res.json({ message: "Successfully followed user" });
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Unfollow a user
router.delete("/:userId", auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove follow relationship
    await Follow.findOneAndDelete({
      follower: currentUserId,
      following: targetUserId,
    });

    // Update user documents
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: targetUserId },
    });

    await User.findByIdAndUpdate(targetUserId, {
      $pull: { followers: currentUserId },
    });

    res.json({ message: "Successfully unfollowed user" });
  } catch (error) {
    console.error("Unfollow error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get followers of a user
router.get("/followers/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("followers", "username fullName profilePicture")
      .select("followers");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      followers: user.followers.map((follower) => ({
        ...follower._doc,
        id: follower._id,
      })),
    });
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get following of a user
router.get("/following/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("following", "username fullName profilePicture")
      .select("following");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      following: user.following.map((following) => ({
        ...following._doc,
        id: following._id,
      })),
    });
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Check if current user follows a specific user
router.get("/status/:userId", auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    const follow = await Follow.findOne({
      follower: currentUserId,
      following: targetUserId,
    });

    res.json({ isFollowing: !!follow });
  } catch (error) {
    console.error("Check follow status error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
