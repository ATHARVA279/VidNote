import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useVideo } from "../contexts/VideoContext";
import { Video, Note } from "../types";
import VideoPlayer from "../components/VideoPlayer";
import TranscriptEditor from "../components/TranscriptEditor";
import { ArrowLeft } from "../components/Icons";

const VideoSummaryPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { fetchVideoById } = useVideo();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<Video | null>(null);

  useEffect(() => {
    const loadVideo = async () => {
      if (!videoId) {
        setError("No video ID provided");
        setIsLoading(false);
        return;
      }

      console.log("Loading video with ID:", videoId);
      setIsLoading(true);
      setError(null);

      try {
        const videoData = await fetchVideoById(videoId);
        console.log("Received video data:", videoData);

        if (videoData) {
          setVideo(videoData);
        } else {
          setError("Video not found or failed to load");
        }
      } catch (err) {
        console.error("Error loading video:", err);
        setError("Error loading video data");
      } finally {
        setIsLoading(false);
      }
    };

    loadVideo();
  }, [videoId, fetchVideoById]);

  const parseNotesToArray = (notesString: string): Note[] => {
    if (!notesString) return [];

    return notesString
      .split("\n\n")
      .filter((text) => text.trim())
      .map((text, index) => ({
        id: `note-${index}`,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      }));
  };

  const userNotes = video ? parseNotesToArray(video.user_notes || "") : [];

  const handleSave = () => {
    console.log("Notes saved successfully");
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="p-6 bg-gray-800 rounded-lg shadow-xl text-center">
          <div className="text-3xl text-red-500 mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="space-x-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Retry
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="p-6 bg-gray-800 rounded-lg shadow-xl text-center">
          <div className="text-3xl text-gray-500 mb-4">📹</div>
          <h2 className="text-xl font-bold mb-2">Video not found</h2>
          <p className="text-gray-400 mb-4">
            The requested video could not be loaded.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const truncateTitle = (title: string, maxLength: number = 50) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength).trim() + "...";
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10 py-4 -mx-6 px-6 border-b border-gray-700/50">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </button>
            <div className="ml-4 flex-1">
              <h1 className="text-2xl font-bold truncate" title={video.title}>
                {truncateTitle(video.title)}
              </h1>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden">
            <VideoPlayer videoId={video.video_id || ""} />
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="w-1 h-6 bg-purple-500 rounded mr-3"></span>
              AI Summary
            </h2>
            {video.summary ? (
              <div className="text-gray-300 whitespace-pre-line leading-relaxed text-sm">
                {video.summary}
              </div>
            ) : (
              <div className="text-gray-500 italic text-center py-8">
                <div className="text-4xl mb-2">📝</div>
                No summary available for this video.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-96 flex-shrink-0 border-l border-gray-700 bg-gray-900/50">
        <div className="h-full">
          <TranscriptEditor
            videoId={video.id}
            initialUserNotes={userNotes}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoSummaryPage;
