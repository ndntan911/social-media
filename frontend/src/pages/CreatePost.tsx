import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postAPI } from "../apis";
import MultiFileUpload from "../components/MultiFileUpload";

const CreatePost: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (files.length === 0) {
      setError("Please select at least one file");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // Append all files
      files.forEach((file) => {
        formData.append("media", file);
      });

      // Append other fields
      formData.append("caption", caption);
      formData.append("location", location);

      await postAPI.createPost(formData);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Media Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Media
          </label>
          <MultiFileUpload
            onFilesChange={setFiles}
            maxFiles={10}
            accept="image/*,video/*"
          />
        </div>

        {/* Caption */}
        <div>
          <label
            htmlFor="caption"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Caption
          </label>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            maxLength={2200}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Write a caption..."
          />
          <p className="text-sm text-gray-500 mt-1">
            {caption.length}/2200 characters
          </p>
        </div>

        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Location
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={50}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Add location"
          />
        </div>

        {/* Submit Button */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading || files.length === 0}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Creating Post..." : "Share Post"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
