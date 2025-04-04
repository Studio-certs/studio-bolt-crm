import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, ArrowRight, Mail, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [loginImage, setLoginImage] = useState('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2400');

  useEffect(() => {
    fetchLoginImage();
  }, []);

  const fetchLoginImage = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'login_image')
      .single();
    
    if (data?.value) {
      setLoginImage(data.value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegistering) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        alert('Registration successful! You can now log in.');
        setIsRegistering(false);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              {isRegistering ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                className="font-medium text-primary-600 hover:text-primary-500 inline-flex items-center"
              >
                {isRegistering ? 'Sign in' : 'Register'}
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 flex items-center justify-center">
              {error}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    {isRegistering ? 'Create Account' : 'Sign in'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Panel - Image */}
      <div className="hidden lg:block relative flex-1 bg-primary-50">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="w-full max-w-2xl">
            <div className="relative">
              <div className="absolute -inset-4">
                <div className="w-full h-full mx-auto opacity-30 blur-lg filter bg-gradient-to-r from-primary-600 to-secondary-600"></div>
              </div>
              <img
                src={loginImage}
                alt="Login illustration"
                className="relative rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
            <div className="mt-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900">YouRM</h3>
              <p className="mt-2 text-gray-600">Your Relationship Manager</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
