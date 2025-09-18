export interface Video {
  id: string;
  video_id?: string;
  url: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  tags: string[];
  dateAdded: string;
  duration?: number;
  uploader?: string;
  summary?: string;
  transcript?: string;
  user_notes?: string;
  last_edited?: string;
}

export interface Note {
  id: string;
  text: string;
  createdAt: string;
}

export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  isHighlighted: boolean;
}

export interface VideoTranscript {
  videoId: string;
  segments: TranscriptSegment[];
  lastEdited: string;
}
