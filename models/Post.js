const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    media: [
      {
        type: {
          type: String,
          enum: ["image", "video"],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        thumbnail: {
          type: String,
          default: "",
        },
      },
    ],
    caption: {
      type: String,
      maxlength: 2200,
      default: "",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      type: String,
      maxlength: 50,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Virtual for likes count
postSchema.virtual("likesCount").get(function () {
  return this.likes?.length || 0;
});

// Virtual for comments count
postSchema.virtual("commentsCount").get(function () {
  return this.comments?.length || 0;
});

// Virtual for media count
postSchema.virtual("mediaCount").get(function () {
  return this.media?.length || 0;
});

// Helper method to get primary media (first item)
postSchema.methods.getPrimaryMedia = function () {
  return this.media.length > 0 ? this.media[0] : null;
};

// Helper method to check if post has video
postSchema.methods.hasVideo = function () {
  return this.media.some((item) => item.type === "video");
};

// Helper method to check if post has image
postSchema.methods.hasImage = function () {
  return this.media.some((item) => item.type === "image");
};

// Ensure virtuals are included in JSON
postSchema.set("toJSON", { virtuals: true });
postSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Post", postSchema);
