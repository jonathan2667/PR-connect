'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, authApi } from '@/lib/api';

interface User {
  id: number;
  full_name: string;
  email: string;
  company_name: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  total_requests: number;
  total_transcripts: number;
  newspaper_usage: Record<string, number>;
  newspapers_used: string[];
}

interface PressReleaseRequest {
  id: number;
  title: string;
  body: string;
  company_name: string;
  category: string;
  created_at: string;
  newspaper: string;
  user: {
    full_name: string;
    email: string;
    company_name: string;
  };
  news_outlet: {
    name: string;
  };
  response_count: number;
  responses: any[];
}

interface AdminStats {
  overview: {
    total_users: number;
    total_requests: number;
    total_responses: number;
    total_transcripts: number;
  };
  outlet_stats: Array<{ name: string; count: number }>;
  category_stats: Array<{ name: string; count: number }>;
  recent_activity: Array<{
    id: number;
    title: string;
    user_name: string;
    user_email: string;
    company: string;
    newspaper: string;
    category: string;
    created_at: string;
  }>;
  user_newspaper_stats: Array<{
    user_name: string;
    user_email: string;
    company: string;
    total_requests: number;
    newspaper_breakdown: Record<string, number>;
  }>;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<PressReleaseRequest[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PressReleaseRequest | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const user = await authApi.getProfile();
      if (!user.is_admin) {
        alert('Admin access required');
        router.push('/dashboard');
        return;
      }
      loadAdminData();
    } catch (error) {
      alert('Authentication failed');
      router.push('/auth/login');
    }
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Load admin data from the backend
      const token = localStorage.getItem('authToken');
      const [usersRes, requestsRes, statsRes] = await Promise.all([
        fetch('https://pr-connect-r40k.onrender.com/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).then(res => res.json()),
        fetch('https://pr-connect-r40k.onrender.com/api/admin/requests', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).then(res => res.json()),
        fetch('https://pr-connect-r40k.onrender.com/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).then(res => res.json())
      ]);
      
      if (usersRes.success) setUsers(usersRes.data);
      if (requestsRes.success) setRequests(requestsRes.data.requests);
      if (statsRes.success) setStats(statsRes.data);
      
    } catch (error) {
      console.error('Error loading admin data:', error);
      alert('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = requests.filter(request =>
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.newspaper.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">🔧 Admin Dashboard</h1>
        <p className="text-gray-600">Complete system overview and user management</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'users', label: '👥 Users' },
            { id: 'requests', label: '📰 All Press Releases' },
            { id: 'newspapers', label: '📰 Newspaper Analytics' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 text-sm font-medium text-center rounded-md transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">👥 Total Users</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.overview.total_users}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">📝 Total Requests</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.overview.total_requests}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">📋 Total Responses</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.overview.total_responses}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">🎤 Total Transcripts</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.overview.total_transcripts}</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">📈 Recent Activity</h3>
              <p className="text-sm text-gray-500">Latest press release requests across all users</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Newspaper</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recent_activity.slice(0, 10).map((activity) => (
                    <tr key={activity.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.user_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.company}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {activity.newspaper}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">👥 User Management</h3>
              <p className="text-sm text-gray-500">All registered users and their newspaper usage</p>
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          {user.is_admin && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.company_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.total_requests}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">📰 All Press Release History</h3>
              <p className="text-sm text-gray-500">Complete history of press releases from all users</p>
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Search press releases..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Newspaper</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.user.full_name}</div>
                        <div className="text-sm text-gray-500">{request.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.company_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {request.newspaper}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Newspapers Tab */}
      {activeTab === 'newspapers' && stats && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">📰 Newspaper Analytics</h3>
              <p className="text-sm text-gray-500">Detailed usage breakdown by user and newspaper</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Requests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Newspaper Breakdown</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.user_newspaper_stats.map((userStat, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{userStat.user_name}</div>
                        <div className="text-sm text-gray-500">{userStat.user_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{userStat.company}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{userStat.total_requests}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(userStat.newspaper_breakdown).map(([newspaper, count]) => (
                            <span key={newspaper} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {newspaper}: {count}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 