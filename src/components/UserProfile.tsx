import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Building2, Mail, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ImageUpload } from './ImageUpload';

export const UserProfile: React.FC = () => {
  const { state, updateUser } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [profile, setProfile] = React.useState({
    name: state.user?.name || '',
    title: '',
    bio: '',
    company: '',
    location: '',
    website: '',
  });

  React.useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!state.user?.id) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', state.user.id)
      .single();

    if (data) {
      setProfile({
        name: data.name || '',
        title: data.title || '',
        bio: data.bio || '',
        company: data.company || '',
        location: data.location || '',
        website: data.website || '',
      });
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          title: profile.title,
          bio: profile.bio,
          company: profile.company,
          location: profile.location,
          website: profile.website,
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.user?.id);

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully');
      setIsEditing(false);
      if (state.user) {
        updateUser({
          ...state.user,
          name: profile.name,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating profile');
    }
  };

  const handleAvatarUpload = async (url: string) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.user?.id);

      if (updateError) throw updateError;

      setShowAvatarUpload(false);
      if (state.user) {
        updateUser({
          ...state.user,
          avatar: url,
        });
      }
      setSuccess('Profile picture updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating profile picture');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Cover Photo */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

        {/* Profile Header */}
        <div className="relative px-6 pb-6">
          <div className="flex items-end absolute -top-16 space-x-6">
            <div className="relative">
              <img
                src={state.user?.avatar}
                alt={state.user?.name}
                className="h-32 w-32 rounded-lg bg-white border-4 border-white shadow-lg object-cover"
              />
              <button
                onClick={() => setShowAvatarUpload(true)}
                className="absolute bottom-2 right-2 p-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-20 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              {profile.title && (
                <p className="text-gray-600">{profile.title}</p>
              )}
              {profile.location && (
                <p className="text-sm text-gray-500">{profile.location}</p>
              )}
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="px-6 py-6 border-t border-gray-200">
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

          {isEditing ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Tell us about yourself"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company
                </label>
                <input
                  type="text"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g. San Francisco, CA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <input
                  type="url"
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="https://example.com"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {profile.bio && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900">About</h3>
                  <p className="mt-2 text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  {profile.company && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Building2 className="h-4 w-4 mr-1" />
                        Company
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">{profile.company}</dd>
                    </div>
                  )}
                  {state.user?.email && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">{state.user.email}</dd>
                    </div>
                  )}
                  {profile.website && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Website</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <a href={profile.website} className="text-indigo-600 hover:text-indigo-500">
                          {profile.website}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAvatarUpload && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Profile Picture</h3>
            <ImageUpload
              onUpload={handleAvatarUpload}
              onError={setError}
            />
            <button
              onClick={() => setShowAvatarUpload(false)}
              className="mt-4 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};