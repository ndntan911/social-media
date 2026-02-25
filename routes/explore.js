const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');

const router = express.Router();

// Get random posts for explore
router.get('/random', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get random posts
    const posts = await Post.aggregate([
      { $sample: { size: 100 } }, // Get random sample of 100 posts
      { $match: {} }, // Match all documents
      { $sort: { createdAt: -1 } }, // Sort by newest
      { $skip: skip },
      { $limit: limit }
    ]);

    // Populate user info
    const populatedPosts = await Post.populate(posts, {
      path: 'user',
      select: 'username profilePicture'
    });

    // Populate comments
    const finalPosts = await Post.populate(populatedPosts, {
      path: 'comments',
      populate: {
        path: 'user',
        select: 'username profilePicture'
      },
      options: { sort: { createdAt: -1 } }
    });

    const totalPosts = await Post.countDocuments();

    res.json({
      posts: finalPosts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
      },
    });
  } catch (error) {
    console.error('Get random posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get trending posts (based on likes and comments)
router.get('/trending', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get posts with high engagement (likes + comments)
    const posts = await Post.aggregate([
      {
        $addFields: {
          engagementScore: {
            $add: [
              { $size: { $ifNull: ['$likes', []] } },
              { $size: { $ifNull: ['$comments', []] } }
            ]
          }
        }
      },
      { $match: {} }, // Match all documents
      { $sort: { engagementScore: -1, createdAt: -1 } }, // Sort by engagement, then by date
      { $skip: skip },
      { $limit: limit }
    ]);

    // Populate user info
    const populatedPosts = await Post.populate(posts, {
      path: 'user',
      select: 'username profilePicture'
    });

    // Populate comments
    const finalPosts = await Post.populate(populatedPosts, {
      path: 'comments',
      populate: {
        path: 'user',
        select: 'username profilePicture'
      },
      options: { sort: { createdAt: -1 } }
    });

    const totalPosts = await Post.countDocuments();

    res.json({
      posts: finalPosts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
      },
    });
  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get popular tags
router.get('/tags', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Get most used tags
    const tags = await Post.aggregate([
      { $unwind: '$tags' }, // Deconstruct tags array
      { $group: { _id: '$tags', count: { $sum: 1 } } }, // Group by tag and count
      { $sort: { count: -1 } }, // Sort by most used
      { $limit: limit }
    ]);

    res.json({ tags });
  } catch (error) {
    console.error('Get popular tags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search posts
router.get('/search', async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let matchQuery = {};

    if (q) {
      if (type === 'caption') {
        matchQuery = { caption: { $regex: q, $options: 'i' } };
      } else if (type === 'tags') {
        matchQuery = { tags: { $in: [q] } };
      } else {
        // Search in caption and tags
        matchQuery = {
          $or: [
            { caption: { $regex: q, $options: 'i' } },
            { tags: { $in: [q] } }
          ]
        };
      }
    }

    const posts = await Post.find(matchQuery)
      .populate('user', 'username profilePicture')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username profilePicture'
        },
        options: { sort: { createdAt: -1 } }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments(matchQuery);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
      },
    });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
