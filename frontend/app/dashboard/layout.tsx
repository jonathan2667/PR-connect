"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { authApi } from "../../lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userCompany, setUserCompany] = useState('Loading...');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserCompany(user.company_name || 'User');
      } catch (err) {
        console.error('Failed to parse user data:', err);
        setUserCompany('User');
      }
    } else {
      setUserCompany('User');
    }
  }, []);

  const handleLogout = () => {
    // Use the authApi logout function
    authApi.logout();
    
    // Redirect to the main page
    router.push('/');
  };

  // Helper function to determine if a link is active
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  // Helper function to get link classes
  const getLinkClasses = (href: string) => {
    const baseClasses = "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors";
    if (isActive(href)) {
      return `${baseClasses} bg-blue-100 text-blue-700 font-semibold`;
    }
    return `${baseClasses} text-gray-700 hover:text-blue-700 hover:bg-blue-50`;
  };

  // Mobile link classes for full-screen menu
  const getMobileLinkClasses = (href: string) => {
    const baseClasses = "flex items-center gap-4 px-6 py-4 text-xl font-semibold transition-colors border-b border-gray-100";
    if (isActive(href)) {
      return `${baseClasses} bg-blue-50 text-blue-700`;
    }
    return `${baseClasses} text-gray-700 hover:text-blue-700 hover:bg-blue-50`;
  };

  // Close mobile menu when clicking a link
  const handleMobileNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Get current page title based on pathname
  const getCurrentPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/request':
        return 'New Request';
      case '/history':
        return 'Request History';
      case '/transcripts':
        return 'Transcripts';
      case '/settings':
        return 'Settings';
      default:
        return 'PRConnect';
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col py-8 px-4">
        <h2 className="text-2xl font-bold text-blue-700 mb-10">Business Dashboard</h2>
        <nav className="flex flex-col gap-2">
          <Link className={getLinkClasses('/dashboard')} href="/dashboard">🏠 Dashboard</Link>
          <Link className={getLinkClasses('/request')} href="/request">➕ New Request</Link>
          <Link className={getLinkClasses('/history')} href="/history">📋 Request History</Link>
          <Link className={getLinkClasses('/transcripts')} href="/transcripts">📝 Transcripts</Link>
          <Link className={getLinkClasses('/settings')} href="/settings">⚙️ Settings</Link>
        </nav>
      </aside>

      {/* Mobile Menu Overlay - Full screen on mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white">
          {/* Mobile menu header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-blue-700">Business Dashboard</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile navigation */}
          <nav className="flex flex-col">
            <Link 
              className={getMobileLinkClasses('/dashboard')} 
              href="/dashboard"
              onClick={handleMobileNavClick}
            >
              <span className="text-2xl">🏠</span>
              <span>Dashboard</span>
            </Link>
            <Link 
              className={getMobileLinkClasses('/request')} 
              href="/request"
              onClick={handleMobileNavClick}
            >
              <span className="text-2xl">➕</span>
              <span>New Request</span>
            </Link>
            <Link 
              className={getMobileLinkClasses('/history')} 
              href="/history"
              onClick={handleMobileNavClick}
            >
              <span className="text-2xl">📋</span>
              <span>Request History</span>
            </Link>
            <Link 
              className={getMobileLinkClasses('/transcripts')} 
              href="/transcripts"
              onClick={handleMobileNavClick}
            >
              <span className="text-2xl">📝</span>
              <span>Transcripts</span>
            </Link>
            <Link 
              className={getMobileLinkClasses('/settings')} 
              href="/settings"
              onClick={handleMobileNavClick}
            >
              <span className="text-2xl">⚙️</span>
              <span>Settings</span>
            </Link>
          </nav>

          {/* Mobile logout section */}
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-gray-50">
            <div className="mb-4">
              <p className="text-gray-600 text-sm">Welcome,</p>
              <p className="text-lg font-semibold text-gray-800">{userCompany}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold py-4 px-6 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Floating Menu Button - Only visible on mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-6 left-4 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Desktop Topbar - Modified for mobile */}
        <header className="flex justify-between items-center px-4 md:px-8 py-4 md:py-6 border-b border-gray-200 bg-white">
          {/* Mobile: Show current page title, Desktop: Show PRConnect */}
          <h1 className="text-xl md:text-2xl font-bold text-blue-700">
            <span className="md:hidden">{getCurrentPageTitle()}</span>
            <span className="hidden md:block">PRConnect</span>
          </h1>
          
          {/* Desktop user info and logout - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-gray-700">Welcome, {userCompany}</span>
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
          
          {/* Mobile: Show user company name only */}
          <div className="md:hidden">
            <span className="text-sm font-medium text-gray-600">{userCompany}</span>
          </div>
        </header>
        
        {/* Main Area - Adjusted padding for mobile */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 