const Notification = require("../models/Notification");

const createNotification = async (
  recipient,
  sender,
  type,
  post = null,
  io = null,
) => {
  try {
    const notification = new Notification({
      recipient,
      sender,
      type,
      post,
      read: false,
    });
    await notification.save();

    // Populate sender info
    await notification.populate("sender", "username profilePicture");
    await notification.populate("post", "image");

    // Emit real-time notification if io instance is available
    if (io) {
      io.to(`user_${recipient}`).emit("new_notification", notification);
      console.log(`Real-time notification sent to user ${recipient}`);
    }

    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
  }
};

module.exports = { createNotification };
