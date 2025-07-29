import React, { useState, useEffect } from 'react';
import { Check, PenSquare, Trash2, Plus, Save } from 'lucide-react';
import { TranscriptSegment, VideoTranscript } from '../types';

interface TranscriptEditorProps {
  transcript: VideoTranscript;
  onSave: (transcript: VideoTranscript) => void;
}

const TranscriptEditor: React.FC<TranscriptEditorProps> = ({ transcript, onSave }) => {
  const [notes, setNotes] = useState<TranscriptSegment[]>([]);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Initialize with any existing notes or an empty array
    setNotes(transcript.segments.filter(segment => segment.isHighlighted));
  }, [transcript]);

  useEffect(() => {
    const isDifferent = JSON.stringify(notes) !== JSON.stringify(transcript.segments.filter(s => s.isHighlighted));
    setHasChanges(isDifferent);
  }, [notes, transcript.segments]);

  const handleEdit = (note: TranscriptSegment) => {
    setEditingNote(note.id);
    setEditText(note.text);
  };

  const handleSaveEdit = () => {
    if (!editingNote) return;
    
    setNotes(notes.map(note => 
      note.id === editingNote 
        ? { ...note, text: editText } 
        : note
    ));
    
    setEditingNote(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditText('');
  };

  const handleDelete = (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId));
  };

  const handleAddNote = () => {
    const newNote: TranscriptSegment = {
      id: `note-${Date.now()}`,
      startTime: 0,
      endTime: 0,
      text: "New note...",
      isHighlighted: true,
    };
    
    setNotes([...notes, newNote]);
    handleEdit(newNote);
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);
    
    try {
      const updatedTranscript = {
        ...transcript,
        segments: [
          ...transcript.segments.filter(segment => !segment.isHighlighted),
          ...notes,
        ],
      };
      onSave(updatedTranscript);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-lg p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Notes</h2>
        <button
          onClick={handleSaveNotes}
          disabled={!hasChanges || isSaving}
          className={`flex items-center px-3 py-1.5 rounded text-sm font-medium transition-colors duration-150
            ${hasChanges 
              ? 'text-white bg-purple-600 hover:bg-purple-700' 
              : 'text-gray-400 bg-gray-700 cursor-not-allowed'}`}
        >
          {isSaving ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Save
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {notes.map(note => (
          <div 
            key={note.id} 
            className="p-3 rounded-lg bg-gray-700 hover:bg-gray-700/80"
          >
            {editingNote === note.id ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-2 py-1 text-xs text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 group">
                <div className="flex-1 text-gray-100">
                  {note.text}
                </div>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(note)}
                    className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-md transition-colors"
                    title="Edit note"
                  >
                    <PenSquare className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-md transition-colors"
                    title="Delete note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-700">
        <button
          onClick={handleAddNote}
          className="w-full flex items-center justify-center py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Note
        </button>
      </div>
    </div>
  );
};

export default TranscriptEditor;