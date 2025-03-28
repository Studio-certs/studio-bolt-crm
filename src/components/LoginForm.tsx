import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [loginImage, setLoginImage] = useState('https://i.imgur.com/vxVBPYp.png');

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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-indigo-600 mb-8">YouRM</h1>
          <div className="rounded-2xl overflow-hidden shadow-2xl mb-8 max-w-[400px] mx-auto">
            <img
              src={loginImage}
              alt="Pixel art office"
              className="w-full object-cover"
            />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {isRegistering ? 'Create an account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              {isRegistering ? 'Sign in' : 'Register'}
            </button>
          </p>
        </div>
        <form className="mt-8 space-y-6 max-w-md mx-auto" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isRegistering ? 'Register' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};