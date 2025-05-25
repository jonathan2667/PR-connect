"use client";

import { useState } from 'react';

interface HistoryItem {
    id: number;
    title: string;
    company: string;
    category: string;
    status: 'completed' | 'pending' | 'draft' | 'failed';
    outlets: string[];
    date: string;
    createdAt: string;
}

export default function RequestHistoryPage() {
    const [historyItems] = useState<HistoryItem[]>([
        {
            id: 1,
            title: 'Revolutionary AI Product Launch Announcement',
            company: 'Acme Corporation',
            category: 'Product Launch',
            status: 'completed',
            outlets: ['TechCrunch', 'Forbes', 'BusinessWire', 'Reuters'],
            date: '2 hours ago',
            createdAt: '2024-01-15T10:30:00Z'
        },
        {
            id: 2,
            title: 'Series A Funding Round - $5M Raised',
            company: 'Acme Corporation',
            category: 'Funding Round',
            status: 'pending',
            outlets: ['VentureBeat', 'Crunchbase', 'TechCrunch'],
            date: '1 day ago',
            createdAt: '2024-01-14T14:15:00Z'
        },
        {
            id: 3,
            title: 'Strategic Partnership with Major Tech Company',
            company: 'Acme Corporation',
            category: 'Partnership',
            status: 'completed',
            outlets: ['Reuters', 'AP News', 'Bloomberg'],
            date: '3 days ago',
            createdAt: '2024-01-12T09:45:00Z'
        },
        {
            id: 4,
            title: 'New CEO Appointment Announcement',
            company: 'Acme Corporation',
            category: 'Executive Appointment',
            status: 'completed',
            outlets: ['Wall Street Journal', 'Forbes', 'BusinessWire'],
            date: '1 week ago',
            createdAt: '2024-01-08T16:20:00Z'
        },
        {
            id: 5,
            title: 'Q4 Financial Results and Company Milestones',
            company: 'Acme Corporation',
            category: 'Company Milestone',
            status: 'draft',
            outlets: [],
            date: '2 weeks ago',
            createdAt: '2024-01-01T11:00:00Z'
        },
        {
            id: 6,
            title: 'Failed Market Expansion Announcement',
            company: 'Acme Corporation',
            category: 'Company Milestone',
            status: 'failed',
            outlets: ['TechCrunch'],
            date: '3 weeks ago',
            createdAt: '2023-12-28T13:30:00Z'
        }
    ]);

    const [filterStatus, setFilterStatus] = useState<string>('all');

    const filteredItems = historyItems.filter(item =>
        filterStatus === 'all' || item.status === filterStatus
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-700';
            case 'pending':
                return 'bg-orange-100 text-orange-700';
            case 'draft':
                return 'bg-gray-100 text-gray-700';
            case 'failed':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return '✅';
            case 'pending':
                return '⏳';
            case 'draft':
                return '📝';
            case 'failed':
                return '❌';
            default:
                return '❓';
        }
    };

    return (
        <div className="w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                        Request History
                    </h1>
                    <p className="text-gray-600 text-lg">
                        View and manage your past press release requests
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-6 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
                    <div className="flex flex-wrap gap-4 items-center">
                        <h3 className="font-semibold text-gray-700">Filter by status:</h3>
                        <div className="flex flex-wrap gap-2">
                            {['all', 'completed', 'pending', 'draft', 'failed'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${filterStatus === status
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* History List */}
                <div className="space-y-4">
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item, index) => (
                            <div
                                key={item.id}
                                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 animate-in slide-in-from-bottom"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                                                {getStatusIcon(item.status)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 leading-tight">
                                                    {item.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                                    <span className="flex items-center gap-1">
                                                        <span className="font-medium">Company:</span>
                                                        {item.company}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="font-medium">Category:</span>
                                                        {item.category}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="font-medium">Created:</span>
                                                        {item.date}
                                                    </span>
                                                </div>
                                                {item.outlets.length > 0 && (
                                                    <div className="mb-3">
                                                        <span className="text-sm font-medium text-gray-700 mb-2 block">
                                                            Target Outlets:
                                                        </span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {item.outlets.map((outlet, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"
                                                                >
                                                                    {outlet}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:ml-4">
                                        <span className={`px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap ${getStatusColor(item.status)}`}>
                                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                        </span>
                                        <div className="flex gap-2">
                                            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200">
                                                View Details
                                            </button>
                                            {item.status === 'draft' && (
                                                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors duration-200">
                                                    Continue
                                                </button>
                                            )}
                                            {item.status === 'failed' && (
                                                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors duration-200">
                                                    Retry
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                                📋
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">No requests found</h3>
                            <p className="text-gray-600 mb-6">
                                {filterStatus === 'all'
                                    ? 'You haven\'t created any press release requests yet.'
                                    : `No requests with status "${filterStatus}" found.`}
                            </p>
                            <button
                                onClick={() => setFilterStatus('all')}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                            >
                                {filterStatus === 'all' ? 'Create Your First Request' : 'Show All Requests'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats Summary */}
                {filteredItems.length > 0 && (
                    <div className="mt-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {historyItems.filter(item => item.status === 'completed').length}
                                </div>
                                <div className="text-sm text-gray-600">Completed</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                    {historyItems.filter(item => item.status === 'pending').length}
                                </div>
                                <div className="text-sm text-gray-600">Pending</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-600">
                                    {historyItems.filter(item => item.status === 'draft').length}
                                </div>
                                <div className="text-sm text-gray-600">Drafts</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">
                                    {historyItems.filter(item => item.status === 'failed').length}
                                </div>
                                <div className="text-sm text-gray-600">Failed</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 