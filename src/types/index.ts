export interface Video {
  id: string;
  url: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  tags: string[];
  dateAdded: string;
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