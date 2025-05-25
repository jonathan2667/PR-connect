"use client";

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import DashboardLayout from '../dashboard/layout';

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

function HistoryContent() {
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
    e.stopPropagation();
    setRequestToDelete(request);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!requestToDelete) return;
    
    try {
      setDeleting(true);
      const result = await api.deleteRequest(requestToDelete.id);
      
      if (result.success) {
        setRequests(prev => prev.filter(req => req.id !== requestToDelete.id));
        setDeleteModalOpen(false);
        setRequestToDelete(null);
        
        if (selectedRequest?.id === requestToDelete.id) {
          setSelectedRequest(null);
        }
        
        setSuccessMessage('Request deleted successfully');
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading request history...</p>
        </div>
      </div>
    );
  }

  if (selectedRequest) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
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

        {/* Request Details Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">{selectedRequest.title}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Company</div>
              <div className="font-medium">{selectedRequest.company_name}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Category</div>
              <div className="font-medium">{selectedRequest.category}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Outlet</div>
              <div className="font-medium">{selectedRequest.news_outlet.name}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Created</div>
              <div className="font-medium">{new Date(selectedRequest.created_at).toLocaleDateString()}</div>
            </div>
          </div>
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2">Original Content</div>
            <div className="bg-gray-50 p-4 rounded-lg border max-h-48 overflow-y-auto">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedRequest.body}</p>
            </div>
          </div>
        </div>

        {/* Generated Responses */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-semibold text-gray-900">Generated Press Releases</h4>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {selectedRequest.responses.length} {selectedRequest.responses.length === 1 ? 'response' : 'responses'}
            </span>
          </div>
          
          {selectedRequest.responses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="text-gray-300 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No responses generated</h3>
              <p className="text-gray-500">This request hasn't generated any press releases yet.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {selectedRequest.responses.map((response, index) => (
                <div key={response.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900">Press Release #{response.id}</h5>
                        <p className="text-sm text-gray-500">{response.tone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <span>🔤</span>
                        {response.word_count} words
                      </span>
                      <span className="flex items-center gap-1">
                        <span>📅</span>
                        {new Date(response.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-mono">
                      {response.body}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">📋 Request History</h1>
        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          {requests.length} total requests
        </div>
      </div>

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

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-gray-300 text-8xl mb-6">📋</div>
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">No requests yet</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Start creating press releases to see your request history here. Your generated content will be saved automatically.
          </p>
          <button
            onClick={() => window.location.href = '/request'}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            ➕ Create New Request
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div 
              key={request.id} 
              className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 p-6 group cursor-pointer"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {request.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {request.body.length > 150 ? request.body.substring(0, 150) + '...' : request.body}
                  </p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <span>🏢</span>
                      {request.company_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>🏷️</span>
                      {request.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>📰</span>
                      {request.news_outlet.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>📅</span>
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{request.responses.length}</div>
                    <div className="text-xs text-gray-500">responses</div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(e, request)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-red-500 text-3xl">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900">Confirm Deletion</h2>
            </div>
            
            {requestToDelete && (
              <div className="mb-8">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete this request and all its responses? This action cannot be undone.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-900 mb-2 font-medium">{requestToDelete.title}</p>
                  <p className="text-xs text-gray-500">
                    {requestToDelete.company_name} • {requestToDelete.responses.length} responses • {new Date(requestToDelete.created_at).toLocaleDateString()}
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

export default function HistoryPage() {
  return (
    <DashboardLayout>
      <HistoryContent />
    </DashboardLayout>
  );
} 