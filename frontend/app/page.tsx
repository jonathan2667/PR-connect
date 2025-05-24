"use client";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center">
      <header className="w-full flex justify-between items-center py-6 px-8 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-blue-700">PRConnect</h1>
        <div>
          <button className="mr-2 px-4 py-2 bg-white border border-blue-700 text-blue-700 rounded hover:bg-blue-50">Login</button>
          <button className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800">Sign Up</button>
        </div>
      </header>
      <section className="flex flex-col items-center mt-20 mb-16">
        <h2 className="text-4xl font-extrabold text-center mb-4">Connect Your Business with <span className="text-blue-700">Top PR Agencies</span></h2>
        <p className="text-lg text-gray-600 text-center max-w-2xl mb-8">Streamline your public relations workflow. Businesses find trusted PR agencies, agencies manage client requests efficiently, and everyone wins with better outcomes.</p>
        <div className="flex gap-4 mb-8">
          <button className="px-6 py-3 bg-blue-700 text-white rounded-lg text-lg font-semibold hover:bg-blue-800">Get Started as Business</button>
          <button className="px-6 py-3 bg-white border border-blue-700 text-blue-700 rounded-lg text-lg font-semibold hover:bg-blue-50">Join as PR Agency</button>
        </div>
      </section>
      <section className="w-full max-w-5xl px-4">
        <h3 className="text-2xl font-bold text-center mb-8">How PRConnect Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="bg-blue-100 text-blue-700 rounded-full p-4 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </div>
            <h4 className="font-bold text-lg mb-2">For Businesses</h4>
            <p className="text-gray-600 text-center">Create your account, connect with verified PR agencies using invite codes, and submit press release requests with ease.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="bg-green-100 text-green-700 rounded-full p-4 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6" /></svg>
            </div>
            <h4 className="font-bold text-lg mb-2">Streamlined Workflow</h4>
            <p className="text-gray-600 text-center">Submit requests, upload media, select news outlets, and track progress all in one unified platform.</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <div className="bg-pink-100 text-pink-700 rounded-full p-4 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 01-8 0m8 0a4 4 0 00-8 0m8 0V5a4 4 0 00-8 0v2m8 0a4 4 0 01-8 0" /></svg>
            </div>
            <h4 className="font-bold text-lg mb-2">For PR Agencies</h4>
            <p className="text-gray-600 text-center">Manage multiple clients, generate targeted press releases, and deliver results efficiently.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
