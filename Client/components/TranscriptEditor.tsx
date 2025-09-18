import React, { useState, useEffect } from "react";
import { PenSquare, Trash2, Plus, Save, Check, X } from "lucide-react";
import { useVideo } from "../contexts/VideoContext";
import { Note } from "../types";

interface TranscriptEditorProps {
  videoId: string;
  initialUserNotes?: Note[];
  onSave?: () => void;
}

const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
  videoId,
  initialUserNotes = [],
  onSave,
}) => {
  const { saveUserNotes } = useVideo();
  const [notes, setNotes] = useState<Note[]>(initialUserNotes);
  const [newNoteText, setNewNoteText] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const isDifferent =
      JSON.stringify(notes) !== JSON.stringify(initialUserNotes);
    setHasChanges(isDifferent);
  }, [notes, initialUserNotes]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: Note = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      createdAt: new Date().toISOString(),
    };

    setNotes([...notes, newNote]);
    setNewNoteText("");
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note.id);
    setEditText(note.text);
  };

  const handleSaveEdit = () => {
    if (!editingNote || !editText.trim()) return;

    setNotes(
      notes.map((note) =>
        note.id === editingNote ? { ...note, text: editText.trim() } : note
      )
    );

    setEditingNote(null);
    setEditText("");
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setEditText("");
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter((note) => note.id !== noteId));
  };

  const handleSaveNotes = async () => {
    setIsSaving(true);

    try {
      const notesString = notes.map((note) => note.text).join("\n\n");
      await saveUserNotes(videoId, notesString);

      if (onSave) {
        onSave();
      }

      setHasChanges(false);
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-tr-lg rounded-br-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Notes</h2>
        <button
          onClick={handleSaveNotes}
          disabled={!hasChanges || isSaving}
          className={`flex items-center px-3 py-1.5 rounded text-sm font-medium transition-colors duration-150
        ${
          hasChanges
            ? "text-white bg-purple-600 hover:bg-purple-700"
            : "text-gray-400 bg-gray-700 cursor-not-allowed"
        }`}
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Save
        </button>
      </div>

      <form onSubmit={handleAddNote} className="mb-6">
        <div className="space-y-3">
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Write your note here..."
            className="w-full p-4 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={4}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newNoteText.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Note
            </button>
          </div>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {notes.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No notes yet. Add your first note above!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              {editingNote === note.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={4}
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 text-sm text-gray-300 hover:text-white flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 group">
                  <div className="flex-1 text-gray-100 whitespace-pre-wrap text-sm leading-relaxed">
                    {note.text}
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-600 rounded-md transition-colors"
                      title="Edit note"
                    >
                      <PenSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-md transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TranscriptEditor;
