import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useVideo } from "../contexts/VideoContext";
import VideoPlayer from "../components/VideoPlayer";
import TranscriptEditor from "../components/TranscriptEditor";
import { ArrowLeft } from "lucide-react";

const VideoSummaryPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { getVideoById, getTranscriptByVideoId, saveVideoTranscript } =
    useVideo();

  const [isLoading, setIsLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [hasFetchedSummary, setHasFetchedSummary] = useState(false);

  const video = useMemo(
    () => (videoId ? getVideoById(videoId) : undefined),
    [videoId, getVideoById]
  );
  const transcript = useMemo(
    () => (videoId ? getTranscriptByVideoId(videoId) : undefined),
    [videoId, getTranscriptByVideoId]
  );

  useEffect(() => {
    if (!videoId) {
      setError("No video ID provided");
      setIsLoading(false);
      return;
    }

    if (!video) {
      setError("Video not found");
      setIsLoading(false);
      return;
    }

    if (!transcript) {
      setError("Transcript not found");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }, [videoId, video, transcript]);

  useEffect(() => {
    if (!videoId || !video?.url) return;

    let isCancelled = false;

    const fetchSummary = async () => {
      setSummaryLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `http://localhost:5000/summary?url=${encodeURIComponent(video.url)}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Summary fetched:", data.notes);

        if (!isCancelled) {
          if (data.notes) {
            setSummary(data.notes);
          } else {
            setError(data.error || "Failed to fetch summary.");
            setSummary(null);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Fetch error:", err);
          setError("Error fetching summary from backend.");
          setSummary(null);
        }
      } finally {
        if (!isCancelled) setSummaryLoading(false);
      }
    };

    fetchSummary();

    return () => {
      isCancelled = true;
    };
  }, [videoId, video?.url]);

  const handleSave = (updatedTranscript: any) => {
    saveVideoTranscript(updatedTranscript);
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !video || !transcript) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="p-6 bg-gray-800 rounded-lg shadow-xl text-center">
          <div className="text-3xl text-red-500 mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-4">{error || "Unknown error"}</p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
          >
            Go back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <button
          onClick={handleBackToDashboard}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>
        <div className="ml-4 flex-1">
          <h1 className="text-2xl font-bold truncate">{video.title}</h1>
          <p className="text-gray-400">{video.author}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content area (video and transcript) */}
        <div className="col-span-2 space-y-6">
          {/* Video player */}
          <div>
            <VideoPlayer videoId={video.id} />
            <div className="mt-4 bg-gray-800 p-4 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {video.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded-md text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Summary section */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">AI Summary</h2>
            {summaryLoading ? (
              <div className="text-gray-400">Generating summary...</div>
            ) : (
              <p className="text-gray-300 whitespace-pre-line">{summary}</p>
            )}
          </div>
        </div>

        {/* Notes editor */}
        <div className="col-span-1">
          <TranscriptEditor transcript={transcript} onSave={handleSave} />
        </div>
      </div>
    </div>
  );
};

export default VideoSummaryPage;
