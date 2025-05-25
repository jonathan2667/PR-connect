"use client";

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface RequestHistory {
  id: number;
  title: string;
  body: string;
  company_name: string;
  category: string;
  created_at: string;
  news_outlet: {
    id: number;
    name: string;
  };
  responses: Array<{
    id: number;
    body: string;
    tone: string;
    word_count: number;
    created_at: string;
  }>;
}

export default function HistoryPage() {
  const [requests, setRequests] = useState<RequestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RequestHistory | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<RequestHistory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const data = await api.getRequests();
        setRequests(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
        console.error('History loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const handleDeleteClick = (e: React.MouseEvent, request: RequestHistory) => {
    e.stopPropagation(); // Prevent opening the request details
    setRequestToDelete(request);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return;
    
    try {
      setDeleting(true);
      const result = await api.deleteRequest(requestToDelete.id);
      
      if (result.success) {
        // Remove the deleted request from the list
        setRequests(prev => prev.filter(req => req.id !== requestToDelete.id));
        setDeleteModalOpen(false);
        setRequestToDelete(null);
        
        // If we were viewing this request, go back to the list
        if (selectedRequest?.id === requestToDelete.id) {
          setSelectedRequest(null);
        }
        setSuccessMessage('Request deleted successfully');
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.message || 'Failed to delete request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete request');
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setRequestToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading request history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-2xl mx-auto mt-8">
        <h3 className="font-bold">Error Loading History</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (selectedRequest) {
    return (
      <div className="max-w-4xl mx-auto mt-8 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Request Details</h2>
          <div className="flex gap-3">
            <button
              onClick={(e) => handleDeleteClick(e, selectedRequest)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              🗑️ Delete
            </button>
            <button 
              onClick={() => setSelectedRequest(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to History
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">{selectedRequest.title}</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <strong>Company:</strong> {selectedRequest.company_name}
            </div>
            <div>
              <strong>Category:</strong> {selectedRequest.category}
            </div>
            <div>
              <strong>Outlet:</strong> {selectedRequest.news_outlet.name}
            </div>
            <div>
              <strong>Created:</strong> {new Date(selectedRequest.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="mb-4">
            <strong>Body:</strong>
            <p className="mt-1 text-gray-700">{selectedRequest.body}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Generated Responses ({selectedRequest.responses.length})</h4>
          {selectedRequest.responses.map((response) => (
            <div key={response.id} className="bg-white rounded-lg border p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium">Response #{response.id}</span>
                <div className="text-sm text-gray-500">
                  {response.word_count} words • {response.tone}
                </div>
              </div>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded">
                {response.body}
              </pre>
              <div className="text-xs text-gray-400 mt-2">
                Generated: {new Date(response.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Request History</h2>
        <div className="text-sm text-gray-600">
          {requests.length} total requests
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

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No requests yet</h3>
          <p className="text-gray-500">Create your first press release request to see it here</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div 
              key={request.id} 
              className="bg-white rounded-lg border hover:shadow-md transition-shadow p-4"
            >
              <div className="flex justify-between items-start">
                <div 
                  className="flex-1 cursor-pointer" 
                  onClick={() => setSelectedRequest(request)}
                >
                  <h3 className="font-semibold text-lg mb-1">{request.title}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{request.body}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>🏢 {request.company_name}</span>
                    <span>📂 {request.category}</span>
                    <span>📰 {request.news_outlet.name}</span>
                    <span>🗓️ {new Date(request.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {request.responses.length} response{request.responses.length !== 1 ? 's' : ''}
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(e, request)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete request"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-red-500 text-2xl">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900">Confirm Deletion</h2>
            </div>
            
            {requestToDelete && (
              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  Are you sure you want to delete this press release request?
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="font-semibold text-sm text-gray-900">{requestToDelete.title}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {requestToDelete.company_name} • {requestToDelete.category}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {requestToDelete.responses.length} response{requestToDelete.responses.length !== 1 ? 's' : ''} will also be deleted
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