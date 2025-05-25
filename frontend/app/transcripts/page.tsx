"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import DashboardLayout from '../dashboard/layout';

interface Transcript {
  id: number;
  text: string;
  created_at: string;
  word_count: number;
  preview: string;
}

function TranscriptsContent() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [selectedTranscripts, setSelectedTranscripts] = useState<number[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
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
        
        // Remove from selected transcripts if it was selected
        setSelectedTranscripts(prev => prev.filter(id => id !== transcriptToDelete.id));
        
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

  const handleTranscriptSelect = (transcriptId: number) => {
    if (!isMultiSelectMode) {
      return;
    }
    
    setSelectedTranscripts(prev => {
      if (prev.includes(transcriptId)) {
        return prev.filter(id => id !== transcriptId);
      } else {
        return [...prev, transcriptId];
      }
    });
  };

  const formatCombinedTranscripts = (transcriptIds: number[]): string => {
    const selectedTranscriptData = transcripts.filter(t => transcriptIds.includes(t.id));
    
    // Sort by creation date (oldest first)
    selectedTranscriptData.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    const combinedContent = selectedTranscriptData.map((transcript, index) => {
      const date = new Date(transcript.created_at);
      const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return `=== TRANSCRIPT ${index + 1} ===
Date: ${formattedDate}
Word Count: ${transcript.word_count} words
Duration: Session ${index + 1} of ${selectedTranscriptData.length}
---
${transcript.text}`;
    }).join('\n\n');

    // Add a header with summary information
    const totalWords = selectedTranscriptData.reduce((sum, t) => sum + t.word_count, 0);
    const dateRange = selectedTranscriptData.length > 1 
      ? `${new Date(selectedTranscriptData[0].created_at).toLocaleDateString()} - ${new Date(selectedTranscriptData[selectedTranscriptData.length - 1].created_at).toLocaleDateString()}`
      : new Date(selectedTranscriptData[0].created_at).toLocaleDateString();

    const header = `=== COMBINED TRANSCRIPT CONTENT ===
Total Sessions: ${selectedTranscriptData.length}
Date Range: ${dateRange}
Combined Word Count: ${totalWords} words
Generated: ${new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

Instructions for AI: The following content contains ${selectedTranscriptData.length} separate transcript session(s) that should be combined and analyzed together to create a comprehensive press release. Each transcript is clearly marked with its timestamp and metadata.

`;

    return header + '\n' + combinedContent;
  };

  const handleUseForPressRelease = (transcriptIds: number[] = []) => {
    let idsToUse = transcriptIds;
    
    // If no IDs provided and we're in single-select mode, use the current transcript
    if (idsToUse.length === 0 && selectedTranscript) {
      idsToUse = [selectedTranscript.id];
    }
    
    // If no IDs provided and we're in multi-select mode, use selected transcripts
    if (idsToUse.length === 0 && isMultiSelectMode) {
      idsToUse = selectedTranscripts;
    }
    
    if (idsToUse.length === 0) {
      setError('Please select at least one transcript');
      return;
    }

    let combinedText: string;
    let source: string;

    if (idsToUse.length === 1) {
      // Single transcript
      const transcript = transcripts.find(t => t.id === idsToUse[0]);
      if (!transcript) {
        setError('Transcript not found');
        return;
      }
      combinedText = transcript.text;
      source = 'transcript';
    } else {
      // Multiple transcripts - format them properly
      combinedText = formatCombinedTranscripts(idsToUse);
      source = 'combined-transcripts';
    }

    // Navigate to request page with the transcript text
    const params = new URLSearchParams({
      body: combinedText,
      source: source
    });
    router.push(`/request?${params.toString()}`);
  };

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedTranscripts([]);
    setSelectedTranscript(null);
  };

  const selectAllTranscripts = () => {
    if (selectedTranscripts.length === transcripts.length) {
      setSelectedTranscripts([]);
    } else {
      setSelectedTranscripts(transcripts.map(t => t.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transcripts...</p>
        </div>
      </div>
    );
  }

  if (selectedTranscript && !isMultiSelectMode) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Transcript Details</h2>
          <div className="flex gap-3">
            <button
              onClick={() => handleUseForPressRelease([selectedTranscript.id])}
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

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
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
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">📝 Saved Transcripts</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {transcripts.length} total transcripts
          </div>
          <button
            onClick={toggleMultiSelectMode}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isMultiSelectMode 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isMultiSelectMode ? '✅ Multi-Select ON' : '☐ Multi-Select OFF'}
          </button>
        </div>
      </div>

      {/* Multi-select controls */}
      {isMultiSelectMode && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-blue-800 font-medium">
                {selectedTranscripts.length} transcript{selectedTranscripts.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={selectAllTranscripts}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {selectedTranscripts.length === transcripts.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            {selectedTranscripts.length > 0 && (
              <button
                onClick={() => handleUseForPressRelease(selectedTranscripts)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                ✨ Combine & Use for Press Release ({selectedTranscripts.length})
              </button>
            )}
          </div>
          
          {selectedTranscripts.length > 1 && (
            <div className="mt-3 text-sm text-blue-700">
              💡 Tip: Selected transcripts will be combined chronologically with timestamps for comprehensive press release generation
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between shadow-sm">
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
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between shadow-sm">
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
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-gray-300 text-8xl mb-6">🎤</div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">No transcripts yet</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Save speech transcripts from the voice input to see them here. Start by creating a new press release with voice input.
          </p>
          <button
            onClick={() => router.push('/request')}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            🎤 Start Voice Recording
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {transcripts.map((transcript) => (
            <div 
              key={transcript.id} 
              className={`bg-white rounded-xl border transition-all duration-200 p-6 group ${
                isMultiSelectMode 
                  ? `cursor-pointer ${
                      selectedTranscripts.includes(transcript.id)
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`
                  : 'border-gray-200 hover:shadow-lg cursor-pointer'
              }`}
              onClick={() => {
                if (isMultiSelectMode) {
                  handleTranscriptSelect(transcript.id);
                } else {
                  setSelectedTranscript(transcript);
                }
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {isMultiSelectMode && (
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedTranscripts.includes(transcript.id)
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-300'
                      }`}>
                        {selectedTranscripts.includes(transcript.id) && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    )}
                    <h3 className={`text-lg font-semibold transition-colors ${
                      isMultiSelectMode && selectedTranscripts.includes(transcript.id)
                        ? 'text-blue-700'
                        : 'text-gray-900 group-hover:text-blue-600'
                    }`}>
                      Transcript #{transcript.id}
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {transcript.preview}
                  </p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <span>📅</span>
                      {new Date(transcript.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>⏰</span>
                      {new Date(transcript.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>🔤</span>
                      {transcript.word_count} words
                    </span>
                  </div>
                </div>
                {!isMultiSelectMode && (
                  <div className="flex items-center gap-3 ml-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseForPressRelease([transcript.id]);
                      }}
                      className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      title="Use for press release"
                    >
                      ✨
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, transcript)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete transcript"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-red-500 text-3xl">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900">Confirm Deletion</h2>
            </div>
            
            {transcriptToDelete && (
              <div className="mb-8">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete this transcript? This action cannot be undone.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-900 mb-2 font-medium">Transcript #{transcriptToDelete.id}</p>
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
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
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

export default function TranscriptsPage() {
  return (
    <DashboardLayout>
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-6 md:py-12 px-2 md:px-4">
        <div className="max-w-full md:max-w-6xl mx-auto">
          <div className="text-center mb-6 md:mb-12 animate-in slide-in-from-top duration-700">
            <h1 className="text-2xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              📝 Transcripts
            </h1>
            <p className="text-base md:text-xl text-gray-600 max-w-full md:max-w-2xl mx-auto leading-relaxed px-2">
              Manage your saved voice transcripts and use them to create press releases
            </p>
          </div>
          <TranscriptsContent />
        </div>
      </div>
    </DashboardLayout>
  );
} 