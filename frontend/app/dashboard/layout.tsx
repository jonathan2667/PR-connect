"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = () => {
    // Clear the auth token from localStorage
    localStorage.removeItem('authToken');

    // Redirect to the main page
    router.push('/');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col py-8 px-4">
        <h2 className="text-2xl font-bold text-blue-700 mb-10">Business Dashboard</h2>
        <nav className="flex flex-col gap-2">
          <Link className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-100 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 font-semibold" href="/dashboard">Dashboard</Link>
          <Link className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-100 text-gray-700 hover:text-blue-700 transition-colors" href="/dashboard/request">+ New Request</Link>
          <Link className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-100 text-gray-700 hover:text-blue-700 transition-colors" href="/dashboard/history">Request History</Link>
          <Link className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-100 text-gray-700 hover:text-blue-700 transition-colors" href="/dashboard/settings">Settings</Link>
        </nav>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="flex justify-between items-center px-8 py-6 border-b border-gray-200 bg-white">
          <h1 className="text-2xl font-bold text-blue-700">PRConnect</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, Acme Corp</span>
            <button
              onClick={handleLogout}
              className="group relative px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
              <div className="relative flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </div>
            </button>
          </div>
        </header>
        {/* Main Area */}
        <main className="flex-1 flex items-center justify-center">
          {children}
        </main>
      </div>
    </div>
  );
} 