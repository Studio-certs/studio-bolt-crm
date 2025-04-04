import React from 'react';
import { Settings, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ImageUpload } from './ImageUpload';

export const AdminSettings: React.FC = () => {
  const [loginImage, setLoginImage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'login_image')
      .single();
    
    if (data) {
      setLoginImage(data.value);
    }
    setIsLoading(false);
  };

  const handleImageUpload = async (url: string) => {
    setError('');
    setSuccess('');
    
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: url })
        .eq('key', 'login_image');

      if (error) throw error;

      setLoginImage(url);
      setSuccess('Login image updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating login image');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Settings className="h-6 w-6 mr-2 text-indigo-600" />
          Application Settings
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage global application settings and customization
        </p>
      </div>

      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ImageIcon className="h-5 w-5 mr-2 text-gray-400" />
              Login Page Image
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              This image will be displayed on the login page
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 text-green-700 p-4 rounded-md">
              {success}
            </div>
          )}

          <div className="space-y-6">
            {loginImage && (
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={loginImage}
                  alt="Current login page"
                  className="w-full h-auto"
                />
              </div>
            )}

            <ImageUpload
              onUpload={handleImageUpload}
              onError={setError}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
