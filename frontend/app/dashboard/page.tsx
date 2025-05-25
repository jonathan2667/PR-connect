"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, authApi } from '../../lib/api';

interface ActivityItem {
  id: number;
  type: string;
  title: string;
  status: string;
  outlets: string[];
  date: string;
  category?: string;
}

interface User {
  id: number;
  full_name: string;
  email: string;
  company_name: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  total_requests?: number;
}

interface AdminData {
  allUsers: User[];
  allRequests: any[];
  systemStats: {
    total_users: number;
    total_requests: number;
    total_responses: number;
    newspaper_breakdown: Record<string, number>;
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    totalOutlets: 0
  });

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [activeAdminTab, setActiveAdminTab] = useState('overview');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [requestDetails, setRequestDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  const checkUserAndLoadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user profile
      const user = await authApi.getProfile();
      setCurrentUser(user);
      
      // Load regular dashboard data
      const data = await api.getDashboardStats();
      if (data) {
        setStats({
          totalRequests: data.totalRequests,
          activeRequests: data.activeRequests,
          completedRequests: data.completedRequests,
          totalOutlets: data.totalOutlets
        });
        setRecentActivity(data.recentActivity || []);
      }

      // If user is admin, load admin data
      if (user?.is_admin) {
        await loadAdminData();
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const [usersRes, requestsRes, statsRes] = await Promise.all([
        fetch('https://pr-connect.onrender.com/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then(res => res.json()),
        fetch('https://pr-connect.onrender.com/api/admin/requests', {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then(res => res.json()),
        fetch('https://pr-connect.onrender.com/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then(res => res.json())
      ]);

      setAdminData({
        allUsers: usersRes.success ? usersRes.data : [],
        allRequests: requestsRes.success ? requestsRes.data.requests : [],
        systemStats: statsRes.success ? statsRes.data.overview : {}
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const fetchRequestDetails = async (requestId: number) => {
    try {
      setLoadingDetails(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`https://pr-connect.onrender.com/api/requests/${requestId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const result = await response.json();
      if (result.success) {
        setRequestDetails(result.data);
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleRequestClick = (request: any) => {
    setSelectedRequest(request);
    fetchRequestDetails(request.id);
  };

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-lg text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <p className="text-red-700">Error loading dashboard: {error}</p>
            </div>
            <button 
              onClick={checkUserAndLoadData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Welcome to Your Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your press releases and track your media outreach
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                📊
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Requests</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 animate-in slide-in-from-bottom duration-500" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                ⏳
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Active</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.activeRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 animate-in slide-in-from-bottom duration-500" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                ✅
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Completed</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.completedRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 animate-in slide-in-from-bottom duration-500" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                📰
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Media Outlets</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOutlets}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/dashboard/request" className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Create New Request</h3>
                  <p className="text-gray-600">Generate professional press releases with AI</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform duration-200">
                  ✨
                </div>
              </div>
            </Link>

            <Link href="/history" className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">View History</h3>
                  <p className="text-gray-600">Review past press releases and campaigns</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform duration-200">
                  📋
                </div>
              </div>
            </Link>

            <Link href="/settings" className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Account Settings</h3>
                  <p className="text-gray-600">Manage your profile and preferences</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform duration-200">
                  ⚙️
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Recent Activity</h2>
            <Link href="/history" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-semibold transition-colors duration-200">
              View All
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recent Activity</h3>
              <p className="text-gray-600 mb-6">You haven't created any press releases yet.</p>
              <Link 
                href="/request" 
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className="mr-2">✨</span>
                Create Your First Request
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${activity.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'
                      }`}>
                      {activity.status === 'completed' ? '✓' : '⏳'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                      <p className="text-sm text-gray-600">
                        {activity.outlets.length > 0 ? `Sent to ${activity.outlets.join(', ')}` : 'No outlets specified'} • {activity.date}
                      </p>
                      {activity.category && (
                        <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full mt-1">
                          {activity.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${activity.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                      }`}>
                      {activity.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Section - Only visible to admin users */}
        {currentUser?.is_admin && adminData && (
          <div className="mt-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-pink-600 bg-clip-text text-transparent mb-2">
                🔧 Admin Dashboard
              </h2>
              <p className="text-gray-600 text-lg">
                System-wide overview and user management
              </p>
            </div>

            {/* Admin Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
                <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">Total System Users</h3>
                <p className="text-3xl font-bold">{adminData.systemStats.total_users || adminData.allUsers.length}</p>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-lg p-6 text-white">
                <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">System Requests</h3>
                <p className="text-3xl font-bold">{adminData.systemStats.total_requests || adminData.allRequests.length}</p>
              </div>
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">System Responses</h3>
                <p className="text-3xl font-bold">{adminData.systemStats.total_responses || 0}</p>
              </div>
            </div>

            {/* Admin Tabs */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 mb-6">
                {[
                  { id: 'overview', label: '📊 Overview' },
                  { id: 'users', label: '👥 All Users' },
                  { id: 'requests', label: '📰 All Requests' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAdminTab(tab.id)}
                    className={`flex-1 py-2 px-4 text-sm font-medium text-center rounded-md transition-colors duration-200 ${
                      activeAdminTab === tab.id
                        ? 'bg-white text-red-700 shadow'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {activeAdminTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800">System Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 mb-3">📰 Newspaper Usage</h4>
                      <div className="space-y-2">
                        {adminData.systemStats.newspaper_breakdown && Object.entries(adminData.systemStats.newspaper_breakdown).map(([newspaper, count]) => (
                          <div key={newspaper} className="flex justify-between items-center">
                            <span className="text-sm">{newspaper}</span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-700 mb-3">📈 Quick Stats</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Active Users:</span>
                          <span className="font-medium">{adminData.allUsers.filter(u => u.is_active).length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Admin Users:</span>
                          <span className="font-medium">{adminData.allUsers.filter(u => u.is_admin).length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Press Releases:</span>
                          <span className="font-medium">{adminData.allRequests.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeAdminTab === 'users' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800">All System Users</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {adminData.allUsers.map((user) => (
                          <tr key={user.id}>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900 flex items-center">
                                  {user.full_name}
                                  {user.is_admin && (
                                    <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.company_name}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.total_requests || 0}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Requests Tab */}
              {activeAdminTab === 'requests' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-800">All Press Release Requests</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Newspaper</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {adminData.allRequests.map((request) => (
                          <tr 
                            key={request.id}
                            onClick={() => handleRequestClick(request)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                          >
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.title}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{request.user?.full_name}</div>
                              <div className="text-sm text-gray-500">{request.user?.email}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{request.company_name}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {request.newspaper || request.news_outlet?.name || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(request.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Press Release Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedRequest.title}</h2>
                  <p className="text-indigo-100 text-sm">
                    By {selectedRequest.user?.full_name} • {selectedRequest.company_name} • {selectedRequest.newspaper}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setRequestDetails(null);
                  }}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-3 text-gray-600">Loading press release content...</span>
                </div>
              ) : requestDetails ? (
                <div className="space-y-6">
                  {/* Request Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">📄 Original Request</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Category:</span>
                        <span className="ml-2 bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">
                          {requestDetails.category}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Created:</span>
                        <span className="ml-2">{new Date(requestDetails.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="font-medium text-gray-600">Request Body:</span>
                      <p className="mt-1 text-gray-700 bg-white p-3 rounded border text-sm">
                        {requestDetails.body}
                      </p>
                    </div>
                  </div>

                  {/* Generated Press Releases */}
                  {requestDetails.responses && requestDetails.responses.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-700 text-lg">📰 Generated Press Releases</h3>
                      {requestDetails.responses.map((response: any, index: number) => (
                        <div key={response.id} className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-800">
                                📰 Press Release #{index + 1}
                              </h4>
                              <div className="flex items-center space-x-4 text-xs text-gray-600">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {response.word_count} words
                                </span>
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  {response.tone}
                                </span>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                  {new Date(response.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="prose max-w-none">
                              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                                {response.body}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📄</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Press Releases Generated</h3>
                      <p className="text-gray-600">This request hasn't generated any press release content yet.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Details</h3>
                  <p className="text-gray-600">Failed to load the press release details.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setRequestDetails(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 