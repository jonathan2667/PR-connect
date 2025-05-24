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
          <button 
            onClick={() => setSelectedRequest(null)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to History
          </button>
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
              className="bg-white rounded-lg border hover:shadow-md transition-shadow cursor-pointer p-4"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{request.title}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{request.body}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>🏢 {request.company_name}</span>
                    <span>📂 {request.category}</span>
                    <span>📰 {request.news_outlet.name}</span>
                    <span>🗓️ {new Date(request.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {request.responses.length} response{request.responses.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 