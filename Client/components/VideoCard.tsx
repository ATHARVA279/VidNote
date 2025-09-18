import React from "react";
import { useNavigate } from "react-router-dom";
import { Video } from "../types";

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/summary/${video.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const truncateTitle = (title: string, maxLength: number = 50) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength).trim() + "...";
  };

  return (
    <div
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:ring-2 hover:ring-purple-500 hover:-translate-y-1"
      onClick={handleClick}
    >
      <div className="aspect-video overflow-hidden bg-gray-900 relative">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
          <h3
            className="text-white font-semibold line-clamp-1"
            title={video.title}
          >
            {truncateTitle(video.title)}
          </h3>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-400 text-sm">{video.author}</p>
          <span className="text-gray-500 text-xs">
            {formatDate(video.dateAdded)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {video.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;