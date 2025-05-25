"use client";

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="w-full flex flex-col sm:flex-row justify-between items-center py-6 px-4 sm:px-8 border-b border-white/20 bg-white/80 backdrop-blur-lg gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          PRConnect
        </h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <Link href="/login" className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-white/70 backdrop-blur border border-gray-200 text-gray-700 rounded-xl hover:bg-white/90 hover:shadow-lg transition-all duration-200 font-semibold text-center">
            Login
          </Link>
          <Link href="/signup" className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-semibold text-center">
            Sign Up
          </Link>
        </div>
      </header>

      <section className="flex flex-col items-center mt-12 sm:mt-20 mb-12 sm:mb-16 px-4 animate-in slide-in-from-top duration-700">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-6 leading-tight text-gray-800">
          Connect Your Business with{' '}
          <span className="text-indigo-700">
            Top PR Agencies
          </span>
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 text-center max-w-3xl mb-8 sm:mb-12 leading-relaxed">
          Streamline your public relations workflow. Businesses find trusted PR agencies, agencies manage client requests efficiently, and everyone wins with better outcomes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-12 sm:mb-16 w-full sm:w-auto">
          <Link href="/signup" className="group relative px-6 sm:px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 hover:scale-105 text-center">
            Get Started as Business
          </Link>
          <Link href="/signup" className="px-6 sm:px-8 py-4 bg-white/80 backdrop-blur-lg border border-white/20 text-gray-700 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl hover:bg-white/90 transform hover:-translate-y-0.5 transition-all duration-200 text-center">
            Join as PR Agency
          </Link>
        </div>
      </section>

      <section className="w-full max-w-6xl mx-auto px-4 mb-20 animate-in slide-in-from-bottom duration-700">
        <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800">
          How PRConnect Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 flex flex-col items-center hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl mb-6 group-hover:scale-110 transition-transform duration-200">
              <span>🏢</span>
            </div>
            <h4 className="font-bold text-lg sm:text-xl mb-4 text-gray-800">For Businesses</h4>
            <p className="text-gray-600 text-center leading-relaxed text-sm sm:text-base">
              Create your account, connect with verified PR agencies using invite codes, and submit press release requests with ease.
            </p>
          </div>
          <div className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 flex flex-col items-center hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl mb-6 group-hover:scale-110 transition-transform duration-200">
              <span>⚡</span>
            </div>
            <h4 className="font-bold text-lg sm:text-xl mb-4 text-gray-800">Streamlined Workflow</h4>
            <p className="text-gray-600 text-center leading-relaxed text-sm sm:text-base">
              Submit requests, upload media, select news outlets, and track progress all in one unified platform.
            </p>
          </div>
          <div className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 flex flex-col items-center hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl mb-6 group-hover:scale-110 transition-transform duration-200">
              <span>🎯</span>
            </div>
            <h4 className="font-bold text-lg sm:text-xl mb-4 text-gray-800">For PR Agencies</h4>
            <p className="text-gray-600 text-center leading-relaxed text-sm sm:text-base">
              Manage multiple clients, generate targeted press releases, and deliver results efficiently.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
