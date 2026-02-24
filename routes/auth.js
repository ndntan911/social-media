const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const auth = require("../middleware/auth");
const passport = require("../config/passport");

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Register user
router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3, max: 30 })
      .trim()
      .withMessage("Username must be 3-30 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("fullName")
      .isLength({ min: 1, max: 50 })
      .trim()
      .withMessage("Full name is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, fullName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        return res.status(400).json({
          message: "User with this email or username already exists",
        });
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
        fullName,
      });

      await user.save();

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          profilePicture: user.profilePicture,
          bio: user.bio,
          followers: user.followers,
          following: user.following,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Login user
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Check password (only if user has password - OAuth users might not)
      if (user.password) {
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return res.status(400).json({ message: "Invalid credentials" });
        }
      } else {
        return res
          .status(400)
          .json({ message: "Please use OAuth login or set a password" });
      }

      // Generate token
      const token = generateToken(user._id);

      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          profilePicture: user.profilePicture,
          bio: user.bio,
          followers: user.followers,
          following: user.following,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// Google OAuth routes
router.get("/google", passport.authenticate("google"));

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const token = generateToken(req.user._id);

    // Redirect to frontend with token
    res.redirect(
      `http://localhost:5173/auth/callback?token=${token}&user=${encodeURIComponent(
        JSON.stringify({
          id: req.user._id,
          username: req.user.username,
          email: req.user.email,
          fullName: req.user.fullName,
          profilePicture: req.user.profilePicture,
          bio: req.user.bio,
          followers: req.user.followers,
          following: req.user.following,
        }),
      )}`,
    );
  },
);

// Facebook OAuth routes
router.get("/facebook", passport.authenticate("facebook"));

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const token = generateToken(req.user._id);

    // Redirect to frontend with token
    res.redirect(
      `http://localhost:5173/auth/callback?token=${token}&user=${encodeURIComponent(
        JSON.stringify({
          id: req.user._id,
          username: req.user.username,
          email: req.user.email,
          fullName: req.user.fullName,
          profilePicture: req.user.profilePicture,
          bio: req.user.bio,
          followers: req.user.followers,
          following: req.user.following,
        }),
      )}`,
    );
  },
);

// Get current user (protected route)
router.get("/me", auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        fullName: req.user.fullName,
        profilePicture: req.user.profilePicture,
        bio: req.user.bio,
        followers: req.user.followers,
        following: req.user.following,
        posts: req.user.posts,
        savedPosts: req.user.savedPosts,
        isVerified: req.user.isVerified,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
