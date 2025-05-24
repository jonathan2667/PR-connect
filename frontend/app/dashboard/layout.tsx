import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col py-8 px-4">
        <h2 className="text-2xl font-bold text-blue-700 mb-10">Business Dashboard</h2>
        <nav className="flex flex-col gap-2">
          <Link className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-100 data-[active=true]:bg-blue-100 data-[active=true]:text-blue-700 font-semibold" href="/dashboard">Dashboard</Link>
          <Link className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-100 text-gray-700 hover:text-blue-700 transition-colors" href="/request">+ New Request</Link>
          <Link className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-100 text-gray-700 hover:text-blue-700 transition-colors" href="/history">Request History</Link>
          <Link className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-100 text-gray-700 hover:text-blue-700 transition-colors" href="/analytics">Analytics</Link>
          <Link className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-100 text-gray-700 hover:text-blue-700 transition-colors" href="/settings">Settings</Link>
        </nav>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="flex justify-between items-center px-8 py-6 border-b border-gray-200 bg-white">
          <h1 className="text-2xl font-bold text-blue-700">PRConnect</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, Acme Corp</span>
            <button className="px-4 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition">Logout</button>
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