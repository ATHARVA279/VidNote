import React, { createContext, useContext, useState, useEffect } from 'react';
import { Video, VideoTranscript } from '../types';

interface VideoContextType {
  videos: Video[];
  currentVideo: Video | null;
  transcripts: VideoTranscript[];
  isLoading: boolean;
  setCurrentVideo: (video: Video) => void;
  addVideo: (url: string) => Promise<string>;
  saveVideoTranscript: (transcript: VideoTranscript) => void;
  saveUserNotes: (videoId: string, userNotes: string) => Promise<void>;
  getUserNotes: (videoId: string) => Promise<{ user_notes: string; last_edited: string } | null>;
  getVideoById: (id: string) => Video | undefined;
  fetchVideoById: (id: string) => Promise<Video | null>;
  getTranscriptByVideoId: (videoId: string) => VideoTranscript | undefined;
  searchVideos: (query: string) => Video[];
  filterVideosByTag: (tag: string) => Video[];
  fetchVideos: () => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
  updateVideoTags: (id: string, tags: string[]) => Promise<void>;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

const API_BASE_URL = 'https://vidnote.onrender.com';

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [transcripts, setTranscripts] = useState<VideoTranscript[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchVideos();
    const savedTranscripts = localStorage.getItem('transcripts');
    if (savedTranscripts) {
      try {
        setTranscripts(JSON.parse(savedTranscripts));
      } catch (error) {
        console.error('Error parsing saved transcripts:', error);
        localStorage.removeItem('transcripts');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('transcripts', JSON.stringify(transcripts));
  }, [transcripts]);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching videos from API...');
      const response = await fetch(`${API_BASE_URL}/videos`);
      if (response.ok) {
        const data = await response.json();
        console.log('Raw API response:', data);
        
        const formattedVideos: Video[] = data.videos.map((video: any) => ({
          id: video.id,
          video_id: video.video_id,
          url: video.url,
          title: video.title || 'Unknown Title',
          author: video.uploader || 'Unknown',
          thumbnailUrl: video.thumbnail || `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`,
          tags: video.tags || [],
          dateAdded: video.created_at,
          duration: video.duration || 0,
          uploader: video.uploader || 'Unknown',
          summary: '',
          transcript: '',
          user_notes: '',
          last_edited: video.last_edited
        }));
        
        console.log('Formatted videos:', formattedVideos);
        setVideos(formattedVideos);
      } else {
        console.error('Failed to fetch videos:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteVideo = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/video/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setVideos(prev => prev.filter(video => video.id !== id));
        if (currentVideo?.id === id) {
          setCurrentVideo(null);
        }
      } else {
        console.error('Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  const updateVideoTags = async (id: string, tags: string[]) => {
    try {
      const response = await fetch(`${API_BASE_URL}/video/${id}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tags })
      });
      if (response.ok) {
        setVideos(prev => prev.map(video => 
          video.id === id ? { ...video, tags } : video
        ));
      } else {
        console.error('Failed to update tags');
      }
    } catch (error) {
      console.error('Error updating tags:', error);
    }
  };

  const saveUserNotes = async (videoId: string, userNotes: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/video/${videoId}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_notes: userNotes
        })
      });
      
      if (response.ok) {
        setVideos(prev => prev.map(video => 
          video.id === videoId ? { 
            ...video, 
            user_notes: userNotes, 
            last_edited: new Date().toISOString()
          } : video
        ));

        if (currentVideo?.id === videoId) {
          setCurrentVideo(prev => prev ? {
            ...prev,
            user_notes: userNotes,
            last_edited: new Date().toISOString()
          } : null);
        }
      } else {
        console.error('Failed to save user notes');
      }
    } catch (error) {
      console.error('Error saving user notes:', error);
      throw error;
    }
  };

  const getUserNotes = async (videoId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/video/${videoId}/notes`);
      
      if (response.ok) {
        return await response.json();
      } else {
        console.error('Failed to fetch user notes');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user notes:', error);
      return null;
    }
  };

  const addVideo = async (url: string): Promise<string> => {
    setIsLoading(true);
    try {
      console.log('Adding video with URL:', url);
      
      const response = await fetch(`${API_BASE_URL}/summary?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to process video');
      }
      
      const data = await response.json();
      console.log('Add video response:', data);
      
      await fetchVideos();
      
      setTimeout(() => {
        const newVideo = videos.find(v => v.id === data.video_id);
        if (newVideo) {
          console.log('Setting current video:', newVideo);
          setCurrentVideo(newVideo);
        } else {
          console.log('New video not found in list, searching by video_id:', data.video_id);
          const videoByYouTubeId = videos.find(v => v.video_id === data.video_id);
          if (videoByYouTubeId) {
            setCurrentVideo(videoByYouTubeId);
          }
        }
      }, 100);
      
      return data.video_id || '';
    } catch (error) {
      console.error('Error adding video:', error);
      throw error;
    } finally {
      setIsLoading(false);
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

  const fetchVideoById = async (id: string): Promise<Video | null> => {
    try {
      console.log('Fetching video by ID:', id);
      
      const existingVideo = videos.find(video => video.id === id);
      if (existingVideo && existingVideo.summary) {
        console.log('Found video in local state with summary:', existingVideo);
        return existingVideo;
      }

      const response = await fetch(`${API_BASE_URL}/video/${id}`);
      if (response.ok) {
        const videoData = await response.json();
        console.log('Fetched video data from API:', videoData);
        
        const formattedVideo: Video = {
          id: videoData.id,
          video_id: videoData.video_id,
          url: videoData.url,
          title: videoData.title || 'Unknown Title',
          author: videoData.uploader || 'Unknown',
          thumbnailUrl: videoData.thumbnail || `https://img.youtube.com/vi/${videoData.video_id}/maxresdefault.jpg`,
          tags: videoData.tags || [],
          dateAdded: videoData.created_at,
          duration: videoData.duration || 0,
          uploader: videoData.uploader || 'Unknown',
          summary: videoData.summary || '',
          transcript: videoData.transcript || '',
          user_notes: videoData.user_notes || '',
          last_edited: videoData.last_edited
        };

        console.log('Formatted video for return:', formattedVideo);

        setVideos(prev => {
          const index = prev.findIndex(v => v.id === formattedVideo.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = formattedVideo;
            return updated;
          } else {
            return [...prev, formattedVideo];
          }
        });

        return formattedVideo;
      } else {
        console.error('Failed to fetch video:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        return null;
      }
    } catch (error) {
      console.error('Error fetching video by ID:', error);
      return null;
    }
  };

  const getTranscriptByVideoId = (videoId: string) => {
    return transcripts.find(transcript => transcript.videoId === videoId);
  };

  const searchVideos = (query: string) => {
    if (!query.trim()) return videos;
    
    const lowercaseQuery = query.toLowerCase();
    return videos.filter(video => 
      video.title.toLowerCase().includes(lowercaseQuery) ||
      video.author.toLowerCase().includes(lowercaseQuery) ||
      (video.summary && video.summary.toLowerCase().includes(lowercaseQuery))
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
      isLoading,
      setCurrentVideo,
      addVideo,
      saveVideoTranscript,
      saveUserNotes,
      getUserNotes,
      getVideoById,
      fetchVideoById,
      getTranscriptByVideoId,
      searchVideos,
      filterVideosByTag,
      fetchVideos,
      deleteVideo,
      updateVideoTags,
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