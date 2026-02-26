const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "comment", "follow"],
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Pre-save hook to generate message
notificationSchema.pre("save", function (next) {
  if (!this.isModified("message") || this.message === "") {
    switch (this.type) {
      case "like":
        this.message = "liked your post";
        break;
      case "comment":
        this.message = "commented on your post";
        break;
      case "follow":
        this.message = "started following you";
        break;
    }
  }
  next();
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
