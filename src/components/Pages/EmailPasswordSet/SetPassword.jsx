import { useState } from 'react'

export default function SetPassword({ onPasswordSet }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSave() {
    // Check for super admin credentials
    if (email === 'superadmin@vsurvey.com' && password === 'superadmin123') {
      onPasswordSet('superadmin');
    } else {
      onPasswordSet('client');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-gray-800">Admin Login</h2>
        
        {/* Admin Credentials Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Super Admin Credentials:</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>Email:</strong> superadmin@vsurvey.com</p>
            <p><strong>Password:</strong> superadmin123</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 sm:p-4 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 sm:p-4 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSave}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 sm:py-4 rounded-md text-sm sm:text-base font-medium transition-colors mt-6"
        >
          Login
        </button>
      </div>
    </div>
  );
}