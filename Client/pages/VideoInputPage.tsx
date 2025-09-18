import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Search } from "../components/Icons";
import { useVideo } from "../contexts/VideoContext";

const VideoInputPage: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addVideo } = useVideo();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoUrl.trim()) {
      setError("Please enter a YouTube video URL");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const videoId = await addVideo(videoUrl);
      navigate(`/summary/${videoId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="max-w-md w-full space-y-8 p-10 bg-gray-800 rounded-xl shadow-2xl transform transition-all">
        <div className="text-center">
          <div className="inline-flex p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full">
            <Video className="h-12 w-12 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold">
            Summarize any YouTube video
          </h2>
          <p className="mt-2 text-gray-400">
            Paste a YouTube video URL to generate a smart summary and notes
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md -space-y-px">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="appearance-none block w-full pl-10 pr-3 py-3 border-2 border-gray-700 rounded-md bg-gray-900 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-900/50 p-3">
              <div className="flex items-center">
                <div className="text-sm text-red-400">{error}</div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-md 
                text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                hover:from-purple-700 hover:to-indigo-700 transition-all duration-200
                ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isLoading ? (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Summarize & Start"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideoInputPage;
