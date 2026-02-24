const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

const router = express.Router();

// Add a comment to a post
router.post('/:postId', auth, [
  body('text').isLength({ min: 1, max: 500 }).trim().withMessage('Comment must be 1-500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const postId = req.params.postId;
    const { text, parentCommentId } = req.body;
    const userId = req.user._id;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Create comment
    const comment = new Comment({
      user: userId,
      post: postId,
      text,
      parentComment: parentCommentId || null
    });

    await comment.save();

    // Add comment to post
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment._id }
    });

    // If it's a reply, add to parent comment's replies
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: comment._id }
      });
    }

    // Populate user info for response
    await comment.populate('user', 'username profilePicture');

    res.status(201).json({
      comment: {
        id: comment._id,
        user: comment.user,
        text: comment.text,
        parentComment: comment.parentComment,
        replies: comment.replies,
        likes: comment.likes,
        createdAt: comment.createdAt
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comments for a post
router.get('/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comments = await Comment.find({ 
      post: postId, 
      parentComment: null 
    })
    .populate('user', 'username profilePicture')
    .populate({
      path: 'replies',
      populate: {
        path: 'user',
        select: 'username profilePicture'
      }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const totalComments = await Comment.countDocuments({ 
      post: postId, 
      parentComment: null 
    });

    res.json({
      comments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalComments / limit),
        totalComments
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a comment
router.delete('/:commentId', auth, async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Remove comment from post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: commentId }
    });

    // If it's a reply, remove from parent comment's replies
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $pull: { replies: commentId }
      });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like a comment
router.post('/like/:commentId', auth, async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if already liked
    if (comment.likes.includes(userId)) {
      return res.status(400).json({ message: 'Comment already liked' });
    }

    // Add like
    await Comment.findByIdAndUpdate(commentId, {
      $push: { likes: userId }
    });

    res.json({ message: 'Comment liked successfully' });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unlike a comment
router.delete('/like/:commentId', auth, async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Remove like
    await Comment.findByIdAndUpdate(commentId, {
      $pull: { likes: userId }
    });

    res.json({ message: 'Comment unliked successfully' });
  } catch (error) {
    console.error('Unlike comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
