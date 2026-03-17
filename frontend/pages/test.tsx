export default function TestPage() {
  return (
    <div className="min-h-screen bg-primary-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-primary-500 mb-4">Test Page Working! 🎉</h1>
        <p className="text-secondary-500">If you see this, everything is set up correctly.</p>
        <div className="mt-4 space-x-4">
          <a href="/" className="text-primary-500 hover:underline">Home</a>
          <a href="/login" className="text-primary-500 hover:underline">Login</a>
          <a href="/register" className="text-primary-500 hover:underline">Register</a>
        </div>
      </div>
    </div>
  );
}