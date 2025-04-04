import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Building2, 
  Mail, 
  Camera, 
  MapPin,
  Globe,
  Briefcase,
  Edit3,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
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

  const InfoField: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    name: keyof typeof profile;
  }> = ({ icon, label, value, name }) => (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 mt-1">
        <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-500">
          {label}
        </label>
        {isEditing ? (
          name === 'bio' ? (
            <textarea
              value={value}
              onChange={(e) => setProfile({ ...profile, [name]: e.target.value })}
              rows={4}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder={`Enter your ${label.toLowerCase()}`}
            />
          ) : (
            <input
              type={name === 'website' ? 'url' : 'text'}
              value={value}
              onChange={(e) => setProfile({ ...profile, [name]: e.target.value })}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder={`Enter your ${label.toLowerCase()}`}
            />
          )
        ) : (
          <p className="mt-1 text-sm text-gray-900">
            {value || <span className="text-gray-400">Not specified</span>}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-400"></div>
        <div className="relative px-6 pb-6">
          <div className="flex items-end absolute -top-16 space-x-6">
            <div className="relative">
              <img
                src={state.user?.avatar}
                alt={state.user?.name}
                className="h-32 w-32 rounded-xl bg-white border-4 border-white shadow-xl object-cover"
              />
              <button
                onClick={() => setShowAvatarUpload(true)}
                className="absolute bottom-2 right-2 p-2 rounded-lg bg-white shadow-md text-gray-700 hover:text-primary-600 transition-colors"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-20">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                {profile.title && (
                  <p className="text-gray-600">{profile.title}</p>
                )}
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium shadow-sm ${
                  isEditing
                    ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    : 'text-white bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {isEditing ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(error || success) && (
        <div className={`rounded-lg p-4 ${
          error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {error || success}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white shadow rounded-xl p-6">
        <div className="space-y-6">
          <InfoField
            icon={<User className="h-5 w-5" />}
            label="Full Name"
            value={profile.name}
            name="name"
          />
          <InfoField
            icon={<Briefcase className="h-5 w-5" />}
            label="Title"
            value={profile.title}
            name="title"
          />
          <InfoField
            icon={<Mail className="h-5 w-5" />}
            label="Email"
            value={state.user?.email || ''}
            name="email"
          />
          <InfoField
            icon={<Building2 className="h-5 w-5" />}
            label="Company"
            value={profile.company}
            name="company"
          />
          <InfoField
            icon={<MapPin className="h-5 w-5" />}
            label="Location"
            value={profile.location}
            name="location"
          />
          <InfoField
            icon={<Globe className="h-5 w-5" />}
            label="Website"
            value={profile.website}
            name="website"
          />
          <InfoField
            icon={<User className="h-5 w-5" />}
            label="Bio"
            value={profile.bio}
            name="bio"
          />

          {isEditing && (
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Upload Modal */}
      {showAvatarUpload && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Update Profile Picture</h3>
              <button
                onClick={() => setShowAvatarUpload(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <ImageUpload
              onUpload={handleAvatarUpload}
              onError={setError}
            />
          </div>
        </div>
      )}
    </div>
  );
};
