"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

interface Transcript {
  id: number;
  text: string;
  created_at: string;
  word_count: number;
  preview: string;
}

export default function TranscriptsPage() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transcriptToDelete, setTranscriptToDelete] = useState<Transcript | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadTranscripts = async () => {
      try {
        setLoading(true);
        const data = await api.getTranscripts();
        setTranscripts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transcripts');
        console.error('Transcripts loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTranscripts();
  }, []);

  const handleDeleteClick = (e: React.MouseEvent, transcript: Transcript) => {
    e.stopPropagation();
    setTranscriptToDelete(transcript);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!transcriptToDelete) return;
    
    try {
      setDeleting(true);
      const result = await api.deleteTranscript(transcriptToDelete.id);
      
      if (result.success) {
        setTranscripts(prev => prev.filter(t => t.id !== transcriptToDelete.id));
        setDeleteModalOpen(false);
        setTranscriptToDelete(null);
        
        if (selectedTranscript?.id === transcriptToDelete.id) {
          setSelectedTranscript(null);
        }
        
        setSuccessMessage('Transcript deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.message || 'Failed to delete transcript');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transcript');
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setTranscriptToDelete(null);
  };

  const handleUseForPressRelease = (transcript: Transcript) => {
    // Navigate to request page with the transcript text
    const params = new URLSearchParams({
      body: transcript.text,
      source: 'transcript'
    });
    router.push(`/request?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transcripts...</p>
        </div>
      </div>
    );
  }

  if (selectedTranscript) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Transcript Details</h2>
          <div className="flex gap-3">
            <button
              onClick={() => handleUseForPressRelease(selectedTranscript)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              ✨ Use for Press Release
            </button>
            <button
              onClick={(e) => handleDeleteClick(e, selectedTranscript)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              🗑️ Delete
            </button>
            <button 
              onClick={() => setSelectedTranscript(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Transcripts
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <strong>Created:</strong> {new Date(selectedTranscript.created_at).toLocaleString()}
            </div>
            <div>
              <strong>Word Count:</strong> {selectedTranscript.word_count} words
            </div>
          </div>
          
          <div className="mb-4">
            <strong>Full Transcript:</strong>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg border max-h-96 overflow-y-auto">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {selectedTranscript.text}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📝 Saved Transcripts</h2>
        <div className="text-sm text-gray-600">
          {transcripts.length} total transcripts
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-green-500 mr-2">✅</span>
            <span>{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-green-700 hover:text-green-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <span>{error}</span>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900"
          >
            ✕
          </button>
        </div>
      )}

      {transcripts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🎤</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No transcripts yet</h3>
          <p className="text-gray-500 mb-4">Save speech transcripts from the voice input to see them here</p>
          <button
            onClick={() => router.push('/request')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            🎤 Start Recording
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {transcripts.map((transcript) => (
            <div 
              key={transcript.id} 
              className="bg-white rounded-lg border hover:shadow-md transition-shadow p-4"
            >
              <div className="flex justify-between items-start">
                <div 
                  className="flex-1 cursor-pointer" 
                  onClick={() => setSelectedTranscript(transcript)}
                >
                  <p className="text-gray-800 text-sm mb-3 leading-relaxed">
                    {transcript.preview}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>📅 {new Date(transcript.created_at).toLocaleDateString()}</span>
                    <span>🔤 {transcript.word_count} words</span>
                    <span>⏰ {new Date(transcript.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleUseForPressRelease(transcript)}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                    title="Use for press release"
                  >
                    ✨ Use
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, transcript)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete transcript"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-red-500 text-2xl">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900">Confirm Deletion</h2>
            </div>
            
            {transcriptToDelete && (
              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  Are you sure you want to delete this transcript?
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-sm text-gray-900 mb-1">{transcriptToDelete.preview}</p>
                  <p className="text-xs text-gray-500">
                    {transcriptToDelete.word_count} words • {new Date(transcriptToDelete.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    🗑️ Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 