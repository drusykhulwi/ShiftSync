export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">ShiftSync</h1>
        <p className="text-white text-xl mb-8">Multi-Location Staff Scheduling</p>
        <div className="space-x-4">
          <a href="/login" className="bg-white text-primary-500 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition">
            Login
          </a>
          <a href="/register" className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-primary-500 transition">
            Register
          </a>
        </div>
      </div>
    </div>
  );
}
