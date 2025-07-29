import React, { createContext, useContext, useState, useEffect } from 'react';
import { Video, VideoTranscript } from '../types';

interface VideoContextType {
  videos: Video[];
  currentVideo: Video | null;
  transcripts: VideoTranscript[];
  setCurrentVideo: (video: Video) => void;
  addVideo: (url: string) => Promise<string>;
  saveVideoTranscript: (transcript: VideoTranscript) => void;
  getVideoById: (id: string) => Video | undefined;
  getTranscriptByVideoId: (videoId: string) => VideoTranscript | undefined;
  searchVideos: (query: string) => Video[];
  filterVideosByTag: (tag: string) => Video[];
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [transcripts, setTranscripts] = useState<VideoTranscript[]>([]);

  useEffect(() => {
    const savedVideos = localStorage.getItem('videos');
    const savedTranscripts = localStorage.getItem('transcripts');
    
    if (savedVideos) {
      setVideos(JSON.parse(savedVideos));
    }
    
    if (savedTranscripts) {
      setTranscripts(JSON.parse(savedTranscripts));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('videos', JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    localStorage.setItem('transcripts', JSON.stringify(transcripts));
  }, [transcripts]);

  const extractVideoId = (url: string): string => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : "";
  };

  const fetchVideoMetadata = async (videoId: string): Promise<any> => {
    // Mock response for demo purposes
    return {
      id: videoId,
      title: `Video ${videoId}`,
      author: 'YouTube Creator',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      tags: ['education', 'technology'],
    };
  };

  const generateMockTranscript = (videoId: string): TranscriptSegment[] => {
    return [
      {
        id: `${videoId}-1`,
        startTime: 0,
        endTime: 5,
        text: "Hello and welcome to this video.",
        isHighlighted: false
      },
      {
        id: `${videoId}-2`,
        startTime: 5,
        endTime: 10,
        text: "Today we'll be discussing an important topic.",
        isHighlighted: false
      },
      {
        id: `${videoId}-3`,
        startTime: 10,
        endTime: 15,
        text: "Let's dive into the main concepts.",
        isHighlighted: false
      }
    ];
  };

  const addVideo = async (url: string): Promise<string> => {
    const videoId = extractVideoId(url);
    
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }
    
    const existingVideo = videos.find(v => v.id === videoId);
    if (existingVideo) {
      setCurrentVideo(existingVideo);
      return videoId;
    }
    
    try {
      const metadata = await fetchVideoMetadata(videoId);
      
      const newVideo: Video = {
        id: videoId,
        url,
        title: metadata.title,
        author: metadata.author,
        thumbnailUrl: metadata.thumbnailUrl,
        tags: metadata.tags,
        dateAdded: new Date().toISOString(),
      };
      
      setVideos(prev => [...prev, newVideo]);
      setCurrentVideo(newVideo);
      
      const newTranscript: VideoTranscript = {
        videoId,
        segments: generateMockTranscript(videoId),
        lastEdited: new Date().toISOString(),
      };
      
      setTranscripts(prev => [...prev, newTranscript]);
      
      return videoId;
    } catch (error) {
      console.error('Error adding video:', error);
      throw error;
    }
  };

  const saveVideoTranscript = (transcript: VideoTranscript) => {
    setTranscripts(prev => {
      const index = prev.findIndex(t => t.videoId === transcript.videoId);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = {
          ...transcript,
          lastEdited: new Date().toISOString(),
        };
        return updated;
      }
      return [...prev, {
        ...transcript,
        lastEdited: new Date().toISOString(),
      }];
    });
  };

  const getVideoById = (id: string) => {
    return videos.find(video => video.id === id);
  };

  const getTranscriptByVideoId = (videoId: string) => {
    return transcripts.find(transcript => transcript.videoId === videoId);
  };

  const searchVideos = (query: string) => {
    if (!query.trim()) return videos;
    
    const lowercaseQuery = query.toLowerCase();
    return videos.filter(video => 
      video.title.toLowerCase().includes(lowercaseQuery) ||
      video.author.toLowerCase().includes(lowercaseQuery)
    );
  };

  const filterVideosByTag = (tag: string) => {
    if (!tag.trim()) return videos;
    return videos.filter(video => video.tags.includes(tag));
  };

  return (
    <VideoContext.Provider value={{
      videos,
      currentVideo,
      transcripts,
      setCurrentVideo,
      addVideo,
      saveVideoTranscript,
      getVideoById,
      getTranscriptByVideoId,
      searchVideos,
      filterVideosByTag,
    }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
};