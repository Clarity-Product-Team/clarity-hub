import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch {
      // Error is handled by store
    }
  };

  return (
    <div className="min-h-screen bg-clarity-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none">
              <path d="M50 0 L58 42 L50 35 L42 42 Z" fill="#0f172a"/>
              <path d="M100 50 L58 58 L65 50 L58 42 Z" fill="#0f172a"/>
              <path d="M50 100 L42 58 L50 65 L58 58 Z" fill="#0f172a"/>
              <path d="M0 50 L42 42 L35 50 L42 58 Z" fill="#0f172a"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Clarity</h1>
          <p className="text-clarity-400 mt-2">Customer Intelligence Hub</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500 transition-colors"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clarity-500 focus:border-clarity-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-clarity-900 hover:bg-clarity-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Demo credentials:
            </p>
            <div className="mt-2 text-xs text-gray-400 text-center space-y-1">
              <p>Admin: admin@getclarity.ai / admin123</p>
              <p>Employee: employee@getclarity.ai / employee123</p>
            </div>
          </div>
        </div>

        <p className="text-center text-clarity-500 text-sm mt-6">
          Powered by getclarity.ai
        </p>
      </div>
    </div>
  );
}
