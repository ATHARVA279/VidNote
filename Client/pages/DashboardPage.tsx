import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVideo } from '../contexts/VideoContext';
import VideoCard from '../components/VideoCard';
import { Search, Plus, Filter } from 'lucide-react';
import { Video } from '../types';

const DashboardPage: React.FC = () => {
  const { videos, searchVideos, filterVideosByTag } = useVideo();
  const [displayedVideos, setDisplayedVideos] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const navigate = useNavigate();

  // Collect all tags from videos
  useEffect(() => {
    const tags = new Set<string>();
    videos.forEach(video => {
      video.tags.forEach(tag => tags.add(tag));
    });
    setAllTags(Array.from(tags));
  }, [videos]);

  // Update displayed videos based on search and filter
  useEffect(() => {
    let filtered = videos;
    
    if (searchQuery) {
      filtered = searchVideos(searchQuery);
    }
    
    if (selectedTag) {
      filtered = filterVideosByTag(selectedTag);
    }
    
    setDisplayedVideos(filtered);
  }, [videos, searchQuery, selectedTag, searchVideos, filterVideosByTag]);

  const handleAddNewVideo = () => {
    navigate('/');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent">
          Your Video Library
        </h1>
        <button
          onClick={handleAddNewVideo}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-md text-white flex items-center transition-all duration-200 shadow-lg hover:shadow-purple-500/20"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add New Video
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Search bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or author..."
            className="block w-full pl-10 pr-3 py-2 border-2 border-gray-700 rounded-md bg-gray-800 placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Tag filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-500" />
          </div>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border-2 border-gray-700 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 appearance-none"
          >
            <option value="">All Tags</option>
            {allTags.map((tag, index) => (
              <option key={index} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {displayedVideos.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center shadow-lg">
          <div className="inline-flex items-center justify-center p-4 bg-gray-700 rounded-full mb-4">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium mb-2">No videos found</h3>
          <p className="text-gray-400 mb-6">
            {videos.length === 0
              ? "You haven't added any videos yet. Add your first video to get started!"
              : "No videos match your current search filters. Try adjusting your search."}
          </p>
          {videos.length === 0 && (
            <button
              onClick={handleAddNewVideo}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white transition-colors inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Video
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;