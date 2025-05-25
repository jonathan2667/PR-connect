"use client";

import { useState } from 'react';

export default function DashboardSettingsPage() {
    const [profileData, setProfileData] = useState({
        fullName: 'John Doe',
        email: 'john.doe@acmecorp.com',
        companyName: 'Acme Corporation',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA'
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
        setIsEditing(false);
    };

    const handleCancel = () => {
        // Reset to original data (in real app, fetch from server)
        setProfileData({
            fullName: 'John Doe',
            email: 'john.doe@acmecorp.com',
            companyName: 'Acme Corporation',
            phone: '+1 (555) 123-4567',
            location: 'San Francisco, CA'
        });
        setIsEditing(false);
    };

    return (
        <div className="w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-6">
            <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom duration-700">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl sm:text-4xl mx-auto mb-6">
                            👤
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2">
                            Profile Settings
                        </h2>
                        <p className="text-gray-600 text-center text-sm sm:text-base">
                            Manage your account information and preferences
                        </p>
                    </div>

                    {/* Profile Form */}
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={profileData.fullName}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur hover:bg-white/90 placeholder-gray-400 text-gray-900 disabled:bg-gray-50 disabled:text-gray-600"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={profileData.email}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur hover:bg-white/90 placeholder-gray-400 text-gray-900 disabled:bg-gray-50 disabled:text-gray-600"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={profileData.companyName}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur hover:bg-white/90 placeholder-gray-400 text-gray-900 disabled:bg-gray-50 disabled:text-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profileData.phone}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur hover:bg-white/90 placeholder-gray-400 text-gray-900 disabled:bg-gray-50 disabled:text-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={profileData.location}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur hover:bg-white/90 placeholder-gray-400 text-gray-900 disabled:bg-gray-50 disabled:text-gray-600"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-6">
                            {!isEditing ? (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 hover:scale-105"
                                >
                                    Edit Profile
                                </button>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={isLoading}
                                        className="flex-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                <span>Saving...</span>
                                            </div>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>

                    {/* Additional Settings */}
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Settings</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                <div>
                                    <h4 className="font-semibold text-gray-800">Account Status</h4>
                                    <p className="text-sm text-gray-600">Your account is active and verified</p>
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                    Active
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                                <div>
                                    <h4 className="font-semibold text-gray-800">PR Agency Connection</h4>
                                    <p className="text-sm text-gray-600">Not connected to any PR agency</p>
                                </div>
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                                    Pending
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 