"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

interface ActivityItem {
  id: number;
  type: string;
  title: string;
  status: string;
  outlets: string[];
  date: string;
  category?: string;
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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
              onClick={loadDashboardData}
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
      </div>
    </div>
  );
} 