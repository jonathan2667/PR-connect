"use client";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg animate-in slide-in-from-bottom duration-700">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 text-center">
          <div className="mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl sm:text-4xl mx-auto mb-6 animate-pulse">
              🔗
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">
              Connect with a PR Agency
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6 sm:mb-8 text-sm sm:text-base">
              You're not currently linked to any PR agency. Enter an invite code to get started and unlock powerful press release generation tools.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                PR Agency Invite Code
              </label>
              <input
                type="text"
                placeholder="Enter PR Agency invite code"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur hover:bg-white/90 placeholder-gray-400 text-center font-mono text-sm sm:text-base"
              />
            </div>

            <button className="group relative w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 px-6 sm:px-8 rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 hover:scale-105">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                <span>Connect & Start Creating</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
            </button>
          </div>

          <div className="mt-6 sm:mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-sm text-indigo-700">
              <span className="font-semibold">Pro tip:</span> Once connected, you'll be able to create professional press releases using our AI-powered tools and distribute them to top media outlets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 