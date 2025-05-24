"use client";

export default function Dashboard() {
  return (
    <div className="bg-white rounded-xl shadow p-8 w-full max-w-md flex flex-col items-center mt-16">
      <div className="mb-4">
        <svg className="w-10 h-10 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
      </div>
      <h2 className="text-xl font-bold mb-2 text-center">Connect with a PR Agency</h2>
      <p className="text-gray-600 text-center mb-4">You're not currently linked to any PR agency. Enter an invite code to get started.</p>
      <input type="text" placeholder="Enter PR Agency invite code" className="w-full border border-gray-300 rounded px-4 py-2 mb-4 focus:ring-2 focus:ring-blue-200 transition" />
      <button className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition">Submit Request</button>
    </div>
  );
} 