const express = require('express');
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const { uploadToMinio } = require('../config/minio');

const router = express.Router();

// Multer config for message images
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for messages'), false);
    }
  },
});

// Get all chats for current user
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      'participants.user': req.user._id,
    })
    .populate('participants.user', 'username profilePicture isOnline')
    .populate('lastMessage.sender', 'username profilePicture')
    .sort({ updatedAt: -1 });

    // Calculate unread count for each chat
    const chatsWithUnread = chats.map(chat => {
      const currentUserParticipant = chat.participants.find(
        p => p.user._id.toString() === req.user._id.toString()
      );
      
      let unreadCount = 0;
      if (chat.lastMessage && chat.lastMessage.sender._id.toString() !== req.user._id.toString()) {
        if (new Date(chat.lastMessage.createdAt) > new Date(currentUserParticipant.lastRead)) {
          unreadCount = 1;
        }
      }

      return {
        ...chat.toObject(),
        unreadCount,
        otherUser: chat.participants.find(p => p.user._id.toString() !== req.user._id.toString())?.user,
      };
    });

    res.json(chatsWithUnread);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat by ID with messages
router.get('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      'participants.user': req.user._id,
    })
    .populate('participants.user', 'username profilePicture isOnline')
    .populate({
      path: 'messages',
      populate: {
        path: 'sender',
        select: 'username profilePicture'
      },
      options: { sort: { createdAt: 1 } }
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Mark messages as read
    await Message.updateMany(
      {
        chat: req.params.chatId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      },
      {
        $push: {
          readBy: {
            user: req.user._id,
            readAt: new Date()
          }
        }
      }
    );

    // Update last read timestamp for user
    await Chat.updateOne(
      {
        _id: req.params.chatId,
        'participants.user': req.user._id
      },
      {
        $set: {
          'participants.$.lastRead': new Date()
        }
      }
    );

    res.json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or get chat with user
router.post('/start/:userId', auth, async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: {
        $all: [
          { user: req.user._id },
          { user: otherUserId }
        ]
      },
      isGroupChat: false
    })
    .populate('participants.user', 'username profilePicture');

    if (chat) {
      return res.json(chat);
    }

    // Create new chat
    chat = new Chat({
      participants: [
        { user: req.user._id },
        { user: otherUserId }
      ],
      isGroupChat: false
    });

    await chat.save();
    await chat.populate('participants.user', 'username profilePicture');

    res.status(201).json(chat);
  } catch (error) {
    console.error('Start chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message
router.post('/:chatId/message', auth, upload.single('image'), [
  body('text').optional().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      'participants.user': req.user._id,
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToMinio(req.file.buffer, `messages/${Date.now()}-${req.file.originalname}`);
    }

    const message = new Message({
      chat: req.params.chatId,
      sender: req.user._id,
      text: req.body.text || '',
      image: imageUrl,
      readBy: [{ user: req.user._id, readAt: new Date() }]
    });

    await message.save();
    await message.populate('sender', 'username profilePicture');

    // Update chat's last message
    await Chat.findByIdAndUpdate(req.params.chatId, {
      lastMessage: {
        text: message.text,
        sender: message.sender._id,
        createdAt: message.createdAt
      }
    });

    // Emit real-time message
    const io = req.app.get('io');
    if (io) {
      // Get other participants
      const otherParticipants = chat.participants
        .filter(p => p.user.toString() !== req.user._id.toString())
        .map(p => p.user.toString());

      otherParticipants.forEach(participantId => {
        io.to(`user_${participantId}`).emit('new_message', {
          chatId: req.params.chatId,
          message: message
        });
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message
router.delete('/message/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      sender: req.user._id,
    }).populate('chat');

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.isDeleted = true;
    await message.save();

    // Emit message deletion
    const io = req.app.get('io');
    if (io) {
      const otherParticipants = message.chat.participants
        .filter(p => p.user.toString() !== req.user._id.toString())
        .map(p => p.user.toString());

      otherParticipants.forEach(participantId => {
        io.to(`user_${participantId}`).emit('message_deleted', {
          messageId: req.params.messageId,
          chatId: message.chat._id
        });
      });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.put('/:chatId/read', auth, async (req, res) => {
  try {
    await Chat.updateOne(
      {
        _id: req.params.chatId,
        'participants.user': req.user._id
      },
      {
        $set: {
          'participants.$.lastRead': new Date()
        }
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
