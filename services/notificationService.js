const Notification = require("../models/Notification");

const createNotification = async (recipient, sender, type, post = null) => {
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
    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
  }
};

module.exports = { createNotification };
